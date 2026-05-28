import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.database import User, UserConnector, SearchLog

def test_api_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "project": "CloudAgnosticControlPlane"}

def test_get_user_connectors(client: TestClient):
    # User 1 is seeded with telegram connector in conftest.py
    response = client.get("/connectors/1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["connector_type"] == "telegram"
    assert data[0]["api_key"] == "mock_telegram_token"

def test_update_user_connector_new_user(client: TestClient, db_session: Session):
    # Change the seeded user's email so that "demo@cacp.io" is free for the new user creation
    seeded_user = db_session.query(User).filter(User.id == 1).first()
    if seeded_user:
        seeded_user.email = "seeded@cacp.io"
        db_session.commit()

    # Create/update connector for a user that doesn't exist
    payload = {
        "user_id": 999,
        "connector_type": "google_sheets",
        "api_key": "sheets_key_abc",
        "config_json": {"folder_id": "xyz"},
        "is_active": 1
    }
    response = client.post("/connectors", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "success", "connector_type": "google_sheets"}

    # Verify user and connector were created
    user = db_session.query(User).filter(User.id == 999).first()
    assert user is not None
    assert user.email == "demo@cacp.io" # Default email used in endpoint for new users

    conn = db_session.query(UserConnector).filter(
        UserConnector.user_id == 999,
        UserConnector.connector_type == "google_sheets"
    ).first()
    assert conn is not None
    assert conn.api_key == "sheets_key_abc"
    assert conn.config_json == {"folder_id": "xyz"}
    assert conn.is_active == 1

def test_update_user_connector_existing(client: TestClient, db_session: Session):
    # Update existing telegram connector for User 1
    # We omit config_json instead of passing None to prevent Pydantic 422 validation error
    payload = {
        "user_id": 1,
        "connector_type": "telegram",
        "api_key": "new_telegram_token",
        "is_active": 0
    }
    response = client.post("/connectors", json=payload)
    assert response.status_code == 200
    
    conn = db_session.query(UserConnector).filter(
        UserConnector.user_id == 1,
        UserConnector.connector_type == "telegram"
    ).first()
    assert conn is not None
    assert conn.api_key == "new_telegram_token"
    assert conn.is_active == 0

def test_search_no_active_connectors(client: TestClient, db_session: Session):
    # Disable all connectors for User 1
    db_session.query(UserConnector).filter(UserConnector.user_id == 1).update({"is_active": 0})
    db_session.commit()

    payload = {"query": "hello", "user_id": 1}
    response = client.post("/search", json=payload)
    assert response.status_code == 404
    assert response.json()["detail"] == "No active connectors found for this user."

def test_search_with_active_connectors(client: TestClient, db_session: Session, mock_httpx_client):
    # Enable telegram connector for User 1
    db_session.query(UserConnector).filter(
        UserConnector.user_id == 1,
        UserConnector.connector_type == "telegram"
    ).update({"is_active": 1, "api_key": "valid_token"})
    db_session.commit()

    payload = {"query": "test query", "user_id": 1}
    response = client.post("/search", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["query"] == "test query"
    assert len(data["results"]) == 1
    assert data["results"][0]["source"] == "telegram"
    assert "test query" in data["results"][0]["content"]

    # Verify search log is saved in DB
    log = db_session.query(SearchLog).filter(
        SearchLog.user_id == 1,
        SearchLog.query == "test query"
    ).first()
    assert log is not None
    assert log.results_count == 1

def test_get_search_logs(client: TestClient, db_session: Session):
    # Seed a search log
    log1 = SearchLog(user_id=1, query="q1", results_count=2)
    log2 = SearchLog(user_id=1, query="q2", results_count=0)
    db_session.add_all([log1, log2])
    db_session.commit()

    response = client.get("/logs/1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert data[0]["query"] == "q2" # sorted by timestamp desc
    assert data[1]["query"] == "q1"

def test_check_connections(client: TestClient, mock_httpx_client):
    # Mock Telegram test_connection
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_httpx_client.get = AsyncMock(return_value=mock_response)

    response = client.get("/health/connections")
    assert response.status_code == 200
    assert response.json() == {"telegram": True}

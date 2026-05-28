import pytest
from sqlalchemy.orm import Session
from app.models.database import User, UserConnector, SearchLog
from app.core import db_manager

def test_database_seeding(db_session: Session):
    # db_manager.init_db() was already called in conftest.py's setup_test_db fixture.
    # Verify that user with id=1 was seeded
    user = db_session.query(User).filter(User.id == 1).first()
    assert user is not None
    assert user.email == "demo@cacp.io"
    assert user.hashed_password == "demo_hashed_password"

    # Verify that the default telegram connector was seeded (since os.environ["TELEGRAM_TOKEN"] is set in conftest)
    connector = db_session.query(UserConnector).filter(
        UserConnector.user_id == 1,
        UserConnector.connector_type == "telegram"
    ).first()
    assert connector is not None
    assert connector.api_key == "mock_telegram_token"
    assert connector.is_active == 1

def test_create_user_and_relations(db_session: Session):
    # Create new user
    new_user = User(id=99, email="test_user@example.com", hashed_password="hashed_pass")
    db_session.add(new_user)
    db_session.commit()

    # Create user connector
    new_connector = UserConnector(
        user_id=new_user.id,
        connector_type="google_sheets",
        api_key="google_key_123",
        is_active=1
    )
    db_session.add(new_connector)
    
    # Create search log
    new_log = SearchLog(
        user_id=new_user.id,
        query="search term",
        results_count=5
    )
    db_session.add(new_log)
    db_session.commit()

    # Fetch user back and check relationships
    user = db_session.query(User).filter(User.id == 99).first()
    assert user is not None
    assert len(user.connectors) == 1
    assert user.connectors[0].connector_type == "google_sheets"
    assert user.connectors[0].api_key == "google_key_123"

    # Verify log was created
    log = db_session.query(SearchLog).filter(SearchLog.user_id == 99).first()
    assert log is not None
    assert log.query == "search term"
    assert log.results_count == 5

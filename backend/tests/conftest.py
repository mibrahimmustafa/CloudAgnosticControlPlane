import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set the test database URL environment variable before importing any app modules
os.environ["DATABASE_URL"] = "sqlite:///test_db.sqlite"
os.environ["TELEGRAM_TOKEN"] = "mock_telegram_token"

from app.core import db_manager
from app.models.database import Base
from app.main import app, get_db

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(autouse=True)
def setup_test_db():
    # Force sqlite database creation and seeding before each test
    Base.metadata.create_all(bind=db_manager.engine)
    db_manager.init_db()  # Seed demo data
    
    yield
    
    # Clean up test database after each test
    Base.metadata.drop_all(bind=db_manager.engine)

@pytest.fixture(scope="session", autouse=True)
def cleanup_db_file():
    yield
    # Dispose engine and delete the test database file at the very end
    db_manager.engine.dispose()
    if os.path.exists("test_db.sqlite"):
        try:
            os.remove("test_db.sqlite")
        except Exception:
            pass

@pytest.fixture
def db_session():
    # Use SessionLocal from db_manager
    session = db_manager.SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def _get_db_override():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def mock_httpx_client():
    from unittest.mock import AsyncMock
    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        
        # mock_client.get should return a MagicMock with status_code 200 by default, 
        # and .json() should return an empty list or expected format
        response_mock = MagicMock()
        response_mock.status_code = 200
        response_mock.json.return_value = {"result": [{"message": {"text": "mock_result", "date": "2026-05-26"}}]}
        mock_client.get.return_value = response_mock
        
        yield mock_client

import pytest
import os
from unittest.mock import AsyncMock, patch, MagicMock
from app.manager import ConnectorManager
from app.connectors.telegram import TelegramConnector

def test_connector_manager_init_with_env():
    # conftest.py sets TELEGRAM_TOKEN="mock_telegram_token"
    manager = ConnectorManager()
    assert "telegram" in manager.active_connectors
    assert isinstance(manager.active_connectors["telegram"], TelegramConnector)
    assert manager.active_connectors["telegram"].api_key == "mock_telegram_token"

def test_connector_manager_init_empty():
    with patch.dict(os.environ, {}, clear=True):
        manager = ConnectorManager()
        assert "telegram" not in manager.active_connectors
        assert len(manager.active_connectors) == 0

@pytest.mark.asyncio
async def test_connector_manager_search_all():
    manager = ConnectorManager()
    
    # Mock Telegram fetch_data
    mock_telegram = AsyncMock()
    mock_telegram.fetch_data.return_value = [{"source": "telegram", "content": "hello"}]
    manager.active_connectors["telegram"] = mock_telegram
    
    results = await manager.search_all("query_text")
    
    assert len(results) == 1
    assert results[0]["source"] == "telegram"
    assert results[0]["content"] == "hello"
    mock_telegram.fetch_data.assert_called_once_with("query_text")

@pytest.mark.asyncio
async def test_connector_manager_test_all_connections():
    manager = ConnectorManager()
    
    # Mock Telegram test_connection to return True
    mock_telegram = AsyncMock()
    mock_telegram.test_connection.return_value = True
    manager.active_connectors["telegram"] = mock_telegram
    
    status = await manager.test_all_connections()
    
    assert status == {"telegram": True}
    mock_telegram.test_connection.assert_called_once()

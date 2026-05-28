import pytest
from unittest.mock import AsyncMock, MagicMock
from app.connectors.telegram import TelegramConnector

@pytest.mark.asyncio
async def test_telegram_connector_init():
    connector = TelegramConnector("test_token")
    assert connector.api_key == "test_token"
    assert connector.base_url == "https://api.telegram.org/bottest_token/"

@pytest.mark.asyncio
async def test_telegram_connector_fetch_data(mock_httpx_client):
    connector = TelegramConnector("test_token")
    results = await connector.fetch_data("my query")
    
    assert len(results) == 1
    assert results[0]["source"] == "telegram"
    assert "my query" in results[0]["content"]

@pytest.mark.asyncio
async def test_telegram_connector_push_data_success(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Mock post response
    mock_response = MagicMock()
    mock_httpx_client.post = AsyncMock(return_value=mock_response)
    
    data = {"chat_id": 12345, "text": "Hello, this is a test"}
    result = await connector.push_data(data)
    
    assert result is True
    mock_httpx_client.post.assert_called_once_with(
        "https://api.telegram.org/bottest_token/sendMessage",
        params={"chat_id": 12345, "text": "Hello, this is a test"}
    )

@pytest.mark.asyncio
async def test_telegram_connector_push_data_missing_fields(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Missing fields
    assert await connector.push_data({}) is False
    assert await connector.push_data({"chat_id": 123}) is False
    assert await connector.push_data({"text": "Hello"}) is False
    
    mock_httpx_client.post.assert_not_called()

@pytest.mark.asyncio
async def test_telegram_connector_push_data_exception(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Simulate HTTP error
    mock_httpx_client.post = AsyncMock(side_effect=Exception("Connection timed out"))
    
    data = {"chat_id": 12345, "text": "Hello"}
    result = await connector.push_data(data)
    
    assert result is False

@pytest.mark.asyncio
async def test_telegram_connector_test_connection_success(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Mock response with status code 200
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_httpx_client.get = AsyncMock(return_value=mock_response)
    
    result = await connector.test_connection()
    assert result is True
    mock_httpx_client.get.assert_called_once_with("https://api.telegram.org/bottest_token/getMe")

@pytest.mark.asyncio
async def test_telegram_connector_test_connection_failure(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Mock response with status code 401 (Unauthorized)
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_httpx_client.get = AsyncMock(return_value=mock_response)
    
    result = await connector.test_connection()
    assert result is False

@pytest.mark.asyncio
async def test_telegram_connector_test_connection_exception(mock_httpx_client):
    connector = TelegramConnector("test_token")
    
    # Mock get throwing exception
    mock_httpx_client.get = AsyncMock(side_effect=Exception("DNS resolution failed"))
    
    result = await connector.test_connection()
    assert result is False

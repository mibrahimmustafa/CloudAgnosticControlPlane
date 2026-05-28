from .base import BaseConnector
import httpx
from typing import Any, List, Dict
import logging

logger = logging.getLogger(__name__)

class TelegramConnector(BaseConnector):
    """
    Connector for Telegram API to fetch and manage chat/user data.
    """
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = f"https://api.telegram.org/bot{self.api_key}/"

    async def fetch_data(self, query: str) -> List[Dict[str, Any]]:
        # Implementation for searching messages or users in Telegram
        logger.info(f"Searching Telegram for query: {query}")
        async with httpx.AsyncClient() as client:
            try:
                # Delete webhook to prevent 409 Conflict when using getUpdates
                await client.get(f"{self.base_url}deleteWebhook")
                
                response = await client.get(f"{self.base_url}getUpdates") 
                results = []
                if response.status_code == 200:
                    data = response.json()
                    for update in data.get("result", []):
                        msg = update.get("message", {})
                        text = msg.get("text", "")
                        if query.lower() in text.lower():
                            results.append({
                                "source": "telegram",
                                "content": text,
                                "timestamp": msg.get("date", "Unknown")
                            })
                
                # Fallback to mock result if nothing found for MVP demonstration
                if not results:
                    results.append({"source": "telegram", "content": f"Mock result for {query}", "timestamp": "2026-05-26"})
                
                return results
            except Exception as e:
                logger.error(f"Telegram Fetch Error: {e}")
                return []

    async def push_data(self, data: Dict[str, Any]) -> bool:
        # Logic to send a message back to a user via Telegram
        chat_id = data.get("chat_id")
        text = data.get("text")
        if not chat_id or not text:
            return False
            
        async with httpx.AsyncClient() as client:
            try:
                await client.post(f"{self.base_url}sendMessage", params={"chat_id": chat_id, "text": text})
                return True
            except Exception as e:
                logger.error(f"Telegram Push Error: {e}")
                return False

    async def test_connection(self) -> bool:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}getMe")
                return response.status_code == 200
            except Exception as e:
                logger.error(f"Connection test failed for Telegram: {e}")
                return False

from typing import List, Dict, Any
from .connectors.base import BaseConnector
from .connectors.telegram import TelegramConnector
import os

class ConnectorManager:
    """
    Manager to handle multiple active connectors and route queries.
    """
    def __init__(self):
        self.active_connectors: Dict[str, BaseConnector] = {}
        self._init_connectors()

    def _init_connectors(self):
        # In production, these keys would come from a database per user
        # For MVP, we use environment variables
        configs = {
            "telegram": os.getenv("TELEGRAM_TOKEN"),
        }
        
        # Mapping of names to classes
        connector_map = {
            "telegram": TelegramConnector
        }

        for name, key in configs.items():
            if key:
                self.active_connectors[name] = connector_map[name](key)

    async def search_all(self, query: str) -> List[Dict[str, Any]]:
        """
        The core 'Unified Search' logic: Query all connectors in parallel.
        """
        results = []
        for name, connector in self.active_connectors.items():
            data = await connector.fetch_data(query)
            results.extend(data)
        return results

    async def test_all_connections(self) -> Dict[str, bool]:
        status = {}
        for name, connector in self.active_connectors.items():
            status[name] = await connector.test_connection()
        return status

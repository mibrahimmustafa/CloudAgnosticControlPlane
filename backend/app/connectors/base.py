import abc
from typing import Any, List, Dict

class BaseConnector(abc.ABC):
    """
    Abstract Base Class for all data connectors.
    Every new integration (Google Sheets, Telegram, etc.) must inherit from this class.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    @abc.abstractmethod
    async def fetch_data(self, query: str) -> List[Dict[str, Any]]:
        """
        Fetch data from the specific source based on a query.
        """
        pass

    @abc.abstractmethod
    async def push_data(self, data: Dict[str, Any]) -> bool:
        """
        Push or update data to the specific source.
        """
        pass

    @abc.abstractmethod
    async def test_connection(self) -> bool:
        """
        Verify if the API key and connection are working.
        """
        pass

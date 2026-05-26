from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .manager import ConnectorManager
from typing import List, Dict, Any

app = FastAPI(title="CloudAgnosticControlPlane API")
manager = ConnectorManager()

class QueryRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    return {"status": "online", "project": "CloudAgnosticControlPlane"}

@app.post("/search")
async def global_search(request: QueryRequest):
    """
    Unified Search Endpoint: Queries all integrated SaaS/Messaging tools.
    """
    results = await manager.search_all(request.query)
    return {"query": request.query, "results": results, "count": len(results)}

@app.get("/health/connections")
async def check_connections():
    """
    Checks if all configured API keys are valid.
    """
    status = await manager.test_all_connections()
    return status

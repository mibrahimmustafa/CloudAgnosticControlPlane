from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .core.db_manager import get_db, init_db
from .models.database import User, UserConnector, SearchLog
from .manager import ConnectorManager
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="CloudAgnosticControlPlane API")
manager = ConnectorManager()

# Initialize DB on startup
@app.on_event("startup")
async def startup():
    init_db()

class QueryRequest(BaseModel):
    query: str
    user_id: int

@app.get("/")
async def root():
    return {"status": "online", "project": "CloudAgnosticControlPlane"}

@app.post("/search")
async def global_search(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Unified Search Endpoint with User-Specific Connectors.
    """
    # 1. Fetch user's active connectors from DB
    connectors = db.query(UserConnector).filter(
        UserConnector.user_id == request.user_id, 
        UserConnector.is_active == 1
    ).all()
    
    if not connectors:
        raise HTTPException(status_code=404, detail="No active connectors found for this user.")

    # 2. Initialize a temporary manager for this specific user's keys
    user_connector_map = {}
    from .connectors.telegram import TelegramConnector
    # Add mapping for other connectors here
    
    mapping = {"telegram": TelegramConnector}
    
    for conn in connectors:
        if conn.connector_type in mapping:
            user_connector_map[conn.connector_type] = mapping[conn.connector_type](conn.api_key)

    # 3. Perform parallel search
    all_results = []
    for name, connector in user_connector_map.items():
        data = await connector.fetch_data(request.query)
        all_results.extend(data)

    # 4. Log the search
    log = SearchLog(user_id=request.user_id, query=request.query, results_count=len(all_results))
    db.add(log)
    db.commit()

    return {"query": request.query, "results": all_results, "count": len(all_results)}

@app.get("/health/connections")
async def check_connections():
    status = await manager.test_all_connections()
    return status

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .core.db_manager import get_db, init_db
from .models.database import User, UserConnector, SearchLog
from .manager import ConnectorManager
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="CloudAgnosticControlPlane API")
manager = ConnectorManager()

class ConnectorUpdate(BaseModel):
    user_id: int
    connector_type: str
    api_key: str
    config_json: Dict[str, Any] = None
    is_active: int = 1


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

@app.get("/connectors/{user_id}")
def get_user_connectors(user_id: int, db: Session = Depends(get_db)):
    connectors = db.query(UserConnector).filter(UserConnector.user_id == user_id).all()
    return [{
        "id": c.id,
        "connector_type": c.connector_type,
        "api_key": c.api_key,
        "config_json": c.config_json,
        "is_active": c.is_active,
        "created_at": c.created_at.isoformat() if c.created_at else None
    } for c in connectors]

@app.post("/connectors")
def update_user_connector(data: ConnectorUpdate, db: Session = Depends(get_db)):
    # Ensure user exists
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        user = User(id=data.user_id, email="demo@cacp.io", hashed_password="demo_hashed_password")
        db.add(user)
        db.commit()

    conn = db.query(UserConnector).filter(
        UserConnector.user_id == data.user_id,
        UserConnector.connector_type == data.connector_type
    ).first()
    
    if conn:
        conn.api_key = data.api_key
        if data.config_json is not None:
            conn.config_json = data.config_json
        conn.is_active = data.is_active
    else:
        conn = UserConnector(
            user_id=data.user_id,
            connector_type=data.connector_type,
            api_key=data.api_key,
            config_json=data.config_json,
            is_active=data.is_active
        )
        db.add(conn)
        
    db.commit()
    return {"status": "success", "connector_type": data.connector_type}

@app.get("/logs/{user_id}")
def get_search_logs(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(SearchLog).filter(SearchLog.user_id == user_id).order_by(SearchLog.timestamp.desc()).limit(50).all()
    return [{
        "id": l.id,
        "query": l.query,
        "results_count": l.results_count,
        "timestamp": l.timestamp.isoformat() if l.timestamp else None
    } for l in logs]


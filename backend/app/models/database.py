from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    connectors = relationship("UserConnector", back_populates="user")

class UserConnector(Base):
    __tablename__ = "user_connectors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    connector_type = Column(String, nullable=False) # e.g., 'telegram', 'google_sheets'
    api_key = Column(String, nullable=False)
    config_json = Column(JSON, nullable=True) # For extra settings per connector
    is_active = Column(Integer, default=1) # 1 for True, 0 for False
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="connectors")

class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query = Column(String, nullable=False)
    results_count = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)

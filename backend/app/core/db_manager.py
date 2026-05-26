from sqlalchemy import create_all
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from .database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/cacp_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency for FastAPI to provide a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from ..models.database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/cacp_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    
    from ..models.database import User, UserConnector
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            default_user = User(
                id=1,
                email="demo@cacp.io",
                hashed_password="demo_hashed_password"
            )
            db.add(default_user)
            db.commit()
            
            telegram_token = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("TELEGRAM_TOKEN")
            if telegram_token:
                conn = UserConnector(
                    user_id=1,
                    connector_type="telegram",
                    api_key=telegram_token,
                    is_active=1
                )
                db.add(conn)
                db.commit()
    except Exception as e:
        import sys
        print(f"Database seeding error: {e}", file=sys.stderr)
    finally:
        db.close()


def get_db():
    """Dependency for FastAPI to provide a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

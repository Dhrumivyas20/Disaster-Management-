import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base
from app.models.village import Village
from app.models.facility import Facility, CandidateSite
from app.db.seed import seed_database

logger = logging.getLogger("pixelalchemy.db")

def create_db_engine():
    db_url = settings.database_url
    try:
        if db_url.startswith("postgres"):
            eng = create_engine(db_url, pool_pre_ping=True)
            with eng.connect() as conn:
                pass
            logger.info("Connected to PostgreSQL database successfully.")
            return eng
        else:
            eng = create_engine(
                db_url, 
                connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
            )
            return eng
    except Exception as e:
        logger.warning(f"Could not connect to configured database ({db_url}): {e}. Using SQLite fallback (pixelalchemy.db).")
        eng = create_engine("sqlite:///./pixelalchemy.db", connect_args={"check_same_thread": False})
        return eng

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)

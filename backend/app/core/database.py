from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

try:
    if settings.database_url and settings.database_url.startswith("postgresql"):
        connect_args = {"sslmode": "require", "connect_timeout": 15}
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            connect_args=connect_args
        )
        with engine.connect() as conn:
            pass
    else:
        engine = create_engine(
            "sqlite:///./roadbuddy.db",
            connect_args={"check_same_thread": False}
        )
except (Exception, ImportError) as e:
    print(f"[Database] Primary PostgreSQL DB connection failed ({e}). Falling back to local SQLite (roadbuddy.db).")
    engine = create_engine(
        "sqlite:///./roadbuddy.db",
        connect_args={"check_same_thread": False}
    )
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config.config import DATABASE_URL

# Create PostgreSQL Engine
engine = create_engine(
    DATABASE_URL,
    echo=False
)

# Create Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base Class for all Models
Base = declarative_base()


# Dependency for FastAPI
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
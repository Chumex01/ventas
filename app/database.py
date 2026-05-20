from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base  # <-- CAMBIO AQUÍ
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ahora se importa desde sqlalchemy.orm
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
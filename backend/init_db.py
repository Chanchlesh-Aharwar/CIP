"""Initialize MySQL tables for Module 02 — uses SQLAlchemy create_all."""
from app.core.database import Base, engine
import app.models  # noqa: F401 register all models

if __name__ == "__main__":
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import inspect
    print("Tables:", inspect(engine).get_table_names())
    print("Done. For future changes, use: alembic revision --autogenerate -m \"message\" && alembic upgrade head")

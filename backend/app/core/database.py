"""Engine, creación de tablas y fábrica de sesiones."""
from typing import Any

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_es_sqlite = settings.DATABASE_URL.startswith("sqlite")
_connect_args: dict[str, Any] = {"check_same_thread": False} if _es_sqlite else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args)

if _es_sqlite:

    @event.listens_for(engine, "connect")
    def _activar_claves_foraneas(conexion: Any, _registro: Any) -> None:
        cursor = conexion.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_all_tables() -> None:
    import app.modules  # noqa: F401  # registra todos los modelos antes de crear las tablas

    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    return Session(engine, expire_on_commit=False)

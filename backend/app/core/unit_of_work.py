"""Unit of Work base: abre la sesión, expone los repositorios y confirma o revierte.

El commit ocurre ÚNICAMENTE en __exit__. Ningún Service ni Router llama a session.commit().
"""
from types import TracebackType
from typing import Optional

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    session: Session

    def __enter__(self) -> "UnitOfWork":
        self.session = session_factory()
        try:
            self._crear_repositorios()
        except BaseException:
            self.session.close()  # __exit__ no corre si __enter__ falla
            raise
        return self

    def __exit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc: Optional[BaseException],
        tb: Optional[TracebackType],
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()

    def _crear_repositorios(self) -> None:
        """Cada módulo crea acá los repositorios que comparten self.session."""

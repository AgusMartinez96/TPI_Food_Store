"""Repositorio base genérico. No hace commit ni aplica reglas de negocio."""
from typing import Generic, Optional, TypeVar

from sqlmodel import Session, SQLModel, select

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, id: int) -> Optional[ModelT]:
        """No filtra por activo: esa regla va en el Service."""
        return self.session.get(self.model, id)

    def get_all(self, skip: int = 0, limit: Optional[int] = None) -> list[ModelT]:
        consulta = select(self.model).order_by(self.model.id).offset(skip)  # type: ignore[attr-defined]
        if limit is not None:
            consulta = consulta.limit(limit)
        return list(self.session.exec(consulta))

    def add(self, entidad: ModelT) -> ModelT:
        """Agrega a la sesión y hace flush (ids y consultas siguientes); no confirma."""
        self.session.add(entidad)
        self.session.flush()
        return entidad

    def delete(self, entidad: ModelT) -> None:
        self.session.delete(entidad)
        self.session.flush()

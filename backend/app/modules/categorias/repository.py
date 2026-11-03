from typing import Optional

from sqlmodel import select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    model = Categoria

    def get_by_nombre(self, nombre: str) -> Optional[Categoria]:
        """Incluye las dadas de baja: la baja no libera el nombre."""
        return self.session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()

    def list_activas(self) -> list[Categoria]:
        consulta = select(Categoria).where(Categoria.activo == True).order_by(Categoria.id)  # noqa: E712
        return list(self.session.exec(consulta))

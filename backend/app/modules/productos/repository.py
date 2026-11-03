from typing import Optional

from sqlmodel import func, select
from sqlalchemy.orm import selectinload

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    model = Producto

    def search(
        self,
        nombre: Optional[str] = None,
        categoria_id: Optional[int] = None,
        disponible: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Producto], int]:
        """Solo productos activos. `nombre` busca por contenido, sin distinguir mayúsculas."""
        condiciones = [Producto.activo == True]  # noqa: E712
        if nombre:
            condiciones.append(func.lower(Producto.nombre).contains(nombre.lower(), autoescape=True))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(Producto.disponible == disponible)

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()
        consulta = (
            select(Producto)
            .where(*condiciones)
            .options(selectinload(Producto.categoria))  # type: ignore[arg-type]
            .order_by(Producto.id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(consulta)), total

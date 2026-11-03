from datetime import datetime
from typing import Optional

from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    def list_by_usuario(
        self, usuario_id: int, estado: Optional[str], skip: int, limit: int
    ) -> tuple[list[Pedido], int]:
        return self._listar([Pedido.usuario_id == usuario_id], estado, skip, limit)

    def list_todos(self, estado: Optional[str], skip: int, limit: int) -> tuple[list[Pedido], int]:
        return self._listar([], estado, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(select(Pedido.estado, func.count()).group_by(Pedido.estado))
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)).one()

    def ingresos_entregados(self) -> float:
        """Suma de `total` de los pedidos ENTREGADO; 0 si no hay ninguno."""
        suma = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0.0)).where(Pedido.estado == "ENTREGADO")
        ).one()
        return float(suma)

    def _listar(
        self, condiciones: list, estado: Optional[str], skip: int, limit: int
    ) -> tuple[list[Pedido], int]:
        if estado is not None:
            condiciones = [*condiciones, Pedido.estado == estado]
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()
        consulta = (
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(Pedido.id.desc())  # type: ignore[attr-defined]
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(consulta)), total

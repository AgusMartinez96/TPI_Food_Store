from typing import Optional

from app.core.tiempo import ahora_utc, inicio_hoy_argentina_utc
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import Usuario

__all__ = [
    "PedidoAjeno",
    "PedidoNoEncontrado",
    "PedidoService",
    "ProductoNoDisponible",
    "ProductoNoEncontrado",
    "ProductoRepetido",
    "StockInsuficiente",
    "TransicionInvalida",
]

# RN-02: mapa de transiciones válidas. Los estados terminales no admiten cambios.
TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


class PedidoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class StockInsuficiente(Exception):
    pass


class ProductoNoDisponible(Exception):
    pass


class ProductoRepetido(Exception):
    pass


class TransicionInvalida(Exception):
    pass


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    def crear(self, usuario: Usuario, datos: PedidoCreate) -> PedidoRead:
        """RN-01: todo en una transacción; si algo falla, el UoW hace rollback y no se persiste nada."""
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            if len(set(ids)) != len(ids):
                raise ProductoRepetido("No se puede repetir un producto en el pedido")

            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario.id,  # type: ignore[arg-type]
                    estado="PENDIENTE",
                    forma_pago=datos.forma_pago,
                    direccion_entrega=datos.direccion_entrega,
                    notas=datos.notas,
                    total=0.0,
                )
            )
            total = 0.0
            for item in datos.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"No existe el producto {item.producto_id}")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente de '{producto.nombre}': hay {producto.stock} y se pidieron {item.cantidad}"
                    )
                producto.stock -= item.cantidad
                uow.productos.add(producto)
                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=producto.id,  # type: ignore[arg-type]
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia: RN-05
                        precio_unitario=producto.precio_base,  # copia: RN-05
                        subtotal=subtotal,
                    )
                )
                total += subtotal
            pedido.total = round(total, 2)
            uow.pedidos.add(pedido)
            return PedidoRead.model_validate(pedido)

    def listar(
        self, usuario: Usuario, skip: int, limit: int, estado: Optional[str]
    ) -> PedidosPaginados:
        with self.uow as uow:
            if usuario.role == "admin":
                pedidos, total = uow.pedidos.list_todos(estado, skip, limit)
            else:
                pedidos, total = uow.pedidos.list_by_usuario(usuario.id, estado, skip, limit)  # type: ignore[arg-type]
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in pedidos])

    def obtener(self, usuario: Usuario, pedido_id: int) -> PedidoRead:
        with self.uow as uow:
            pedido = self._existente(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        """Admin: avanza o cancela según la máquina de estados (RN-02, RN-03)."""
        with self.uow as uow:
            pedido = self._existente(uow, pedido_id)
            self._aplicar_estado(uow, pedido, nuevo_estado)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, usuario: Usuario, pedido_id: int) -> PedidoRead:
        """Solo el dueño, solo desde PENDIENTE (RN-03, RN-04). Un admin ajeno recibe PedidoAjeno."""
        with self.uow as uow:
            pedido = self._existente(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("Solo podés cancelar tus propios pedidos")
            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida("Solo se puede cancelar un pedido en estado PENDIENTE")
            self._aplicar_estado(uow, pedido, "CANCELADO")
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            por_estado = uow.pedidos.count_by_estado()
            return ResumenPedidos(
                pendientes=por_estado.get("PENDIENTE", 0),
                en_preparacion=por_estado.get("EN_PREPARACION", 0),
                entregados=por_estado.get("ENTREGADO", 0),
                cancelados=por_estado.get("CANCELADO", 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy_argentina_utc()),
                ingresos_entregados=uow.pedidos.ingresos_entregados(),
            )

    @staticmethod
    def _existente(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(f"No existe el pedido {pedido_id}")
        return pedido

    @staticmethod
    def _aplicar_estado(uow: PedidoUnitOfWork, pedido: Pedido, nuevo_estado: str) -> None:
        if nuevo_estado not in TRANSICIONES[pedido.estado]:
            raise TransicionInvalida(f"No se puede pasar de {pedido.estado} a {nuevo_estado}")
        if nuevo_estado == "CANCELADO":
            for linea in pedido.items:
                # get_by_id no filtra por activo: se restituye aunque el producto esté dado de baja
                producto = uow.productos.get_by_id(linea.producto_id)
                if producto is not None:
                    producto.stock += linea.cantidad
                    uow.productos.add(producto)
        pedido.estado = nuevo_estado
        pedido.updated_at = ahora_utc()
        uow.pedidos.add(pedido)

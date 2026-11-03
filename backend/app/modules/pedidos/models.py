from typing import TYPE_CHECKING, Optional

from pydantic import NaiveDatetime
from sqlmodel import Field, Relationship, SQLModel

from app.core.tiempo import ahora_utc

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class Pedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado: str = Field(default="PENDIENTE")
    forma_pago: str
    direccion_entrega: str
    notas: Optional[str] = Field(default=None)
    total: float = Field(default=0.0)
    created_at: NaiveDatetime = Field(default_factory=ahora_utc)
    updated_at: NaiveDatetime = Field(default_factory=ahora_utc)

    usuario: Optional["Usuario"] = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(
        back_populates="pedido", sa_relationship_kwargs={"order_by": "DetallePedido.id"}
    )


class DetallePedido(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    cantidad: int
    nombre_producto: str  # copia del producto al crear el pedido (RN-05)
    precio_unitario: float  # copia del producto al crear el pedido (RN-05)
    subtotal: float

    pedido: Optional["Pedido"] = Relationship(back_populates="items")
    producto: Optional["Producto"] = Relationship(back_populates="detalles")

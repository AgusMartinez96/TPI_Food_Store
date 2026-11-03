from typing import TYPE_CHECKING, Optional

from pydantic import NaiveDatetime
from sqlmodel import Field, Relationship, SQLModel

from app.core.tiempo import ahora_utc

if TYPE_CHECKING:
    from app.modules.pedidos.models import Pedido


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: str = Field(default="user")  # "user" | "admin"
    disabled: bool = Field(default=False)
    created_at: NaiveDatetime = Field(default_factory=ahora_utc)

    pedidos: list["Pedido"] = Relationship(back_populates="usuario")

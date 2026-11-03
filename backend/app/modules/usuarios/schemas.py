from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.core.tiempo import UtcDatetime


MAX_PASSWORD = 128  # bcrypt solo usa 72 bytes y passlib falla (500) con claves de miles de caracteres


class UserCreate(SQLModel):
    username: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8, max_length=MAX_PASSWORD)


class UserPublic(SQLModel):
    """Nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: UtcDatetime

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.core.tiempo import UtcDatetime


class UserCreate(SQLModel):
    username: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)


class UserPublic(SQLModel):
    """Nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: UtcDatetime

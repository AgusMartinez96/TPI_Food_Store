from pydantic import EmailStr, field_validator
from sqlmodel import Field, SQLModel

from app.core.tiempo import UtcDatetime


MAX_PASSWORD_BYTES = 72  # bcrypt ignora en silencio lo que pase de 72 BYTES (no caracteres)


class UserCreate(SQLModel):
    username: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validar_password_bytes(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(
                f"La contraseña no puede superar los {MAX_PASSWORD_BYTES} bytes "
                "(las letras con tilde y los símbolos ocupan más de 1 byte)"
            )
        return valor


class UserPublic(SQLModel):
    """Nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: UtcDatetime

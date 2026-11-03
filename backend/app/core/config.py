"""Configuración de la aplicación, leída de backend/.env con pydantic-settings."""
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    @field_validator("SECRET_KEY")
    @classmethod
    def validar_secret_key(cls, valor: str) -> str:
        if len(valor) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres")
        return valor


settings = Settings()  # type: ignore[call-arg]  # los valores obligatorios vienen del .env

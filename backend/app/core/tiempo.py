"""Fechas: se guardan en UTC sin zona (naive); "hoy" se mide desde la medianoche de Argentina."""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from pydantic import BeforeValidator

ARGENTINA = timezone(timedelta(hours=-3))


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _marcar_utc(valor: object) -> object:
    """La base devuelve UTC naive: se marca como UTC para que la API lo serialice con Z."""
    if isinstance(valor, datetime) and valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor


# Para los schemas de lectura: "2026-11-03T13:13:02.121195Z"
UtcDatetime = Annotated[datetime, BeforeValidator(_marcar_utc)]


def inicio_hoy_argentina_utc(ahora: Optional[datetime] = None) -> datetime:
    """Medianoche de Argentina (UTC-3) de hoy, expresada en UTC naive para comparar con created_at.

    `ahora` (con zona) permite fijar el instante de referencia; por defecto es el momento actual.
    """
    referencia = ahora if ahora is not None else datetime.now(timezone.utc)
    inicio = referencia.astimezone(ARGENTINA).replace(hour=0, minute=0, second=0, microsecond=0)
    return inicio.astimezone(timezone.utc).replace(tzinfo=None)

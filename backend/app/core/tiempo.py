"""Fechas: se guardan en UTC sin zona (naive); "hoy" se mide desde la medianoche de Argentina."""
from datetime import datetime, timedelta, timezone

ARGENTINA = timezone(timedelta(hours=-3))


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def inicio_hoy_argentina_utc() -> datetime:
    """Medianoche de Argentina (UTC-3) de hoy, expresada en UTC naive para comparar con created_at."""
    inicio = datetime.now(ARGENTINA).replace(hour=0, minute=0, second=0, microsecond=0)
    return inicio.astimezone(timezone.utc).replace(tzinfo=None)

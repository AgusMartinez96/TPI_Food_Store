"""Dependencias de autenticación y autorización (cookie HttpOnly + rol del usuario)."""
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    """Lee el token SOLO de la cookie `access_token`; el header Authorization se ignora."""

    async def __call__(self, request: Request) -> Optional[str]:
        return request.cookies.get("access_token")


oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token", auto_error=False)


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Usuario:
    """Usuario de la sesión, aunque esté desactivado. 401 si falta la cookie o el token no sirve."""
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    payload = decode_access_token(token)
    if payload is None or not str(payload.get("sub", "")).isdigit():
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o vencido")
    with session_factory() as session:  # solo lectura: no hay commit
        usuario = session.get(Usuario, int(payload["sub"]))
    if usuario is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o vencido")
    return usuario


def get_current_active_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
    return usuario


def require_role(roles: list[str]) -> Callable[..., Usuario]:
    def verificar(usuario: Usuario = Depends(get_current_active_user)) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tenés permisos para esta operación")
        return usuario

    return verificar

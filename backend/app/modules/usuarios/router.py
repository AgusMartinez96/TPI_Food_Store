from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import (
    AutodesactivacionNoPermitida,
    UsuarioNoEncontrado,
    UsuarioService,
)
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios (admin)"])


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


@router.get("", response_model=list[UserPublic])
def listar_usuarios(
    _admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
) -> list[UserPublic]:
    return service.listar()


@router.post("/{id}/activar", response_model=UserPublic)
def activar_usuario(
    id: int,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.activar(id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.post("/{id}/desactivar", response_model=UserPublic)
def desactivar_usuario(
    id: int,
    admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.desactivar(id, admin.id)  # type: ignore[arg-type]
    except UsuarioNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except AutodesactivacionNoPermitida as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

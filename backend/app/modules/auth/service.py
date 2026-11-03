from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def register(self, datos: UserCreate) -> UserPublic:
        with self.uow as uow:
            if uow.usuarios.get_by_username(datos.username) is not None:
                raise UsuarioDuplicado("El nombre de usuario ya está registrado")
            if uow.usuarios.get_by_email(datos.email) is not None:
                raise UsuarioDuplicado("El email ya está registrado")
            usuario = uow.usuarios.add(
                Usuario(
                    username=datos.username,
                    full_name=datos.full_name,
                    email=datos.email,
                    hashed_password=hash_password(datos.password),
                    role="user",
                )
            )
            return UserPublic.model_validate(usuario)

    def login(self, username: str, password: str) -> str:
        """Devuelve el JWT. Primero credenciales (401) y después cuenta desactivada (400)."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos")
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
            return create_access_token({"sub": str(usuario.id)})

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import MAX_PASSWORD, UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

# Se verifica contra este hash cuando el usuario no existe, así el login tarda igual
# exista o no el usuario y no se pueden enumerar usernames por tiempo de respuesta.
_HASH_FALSO = hash_password("clave-que-nadie-usa")


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def register(self, datos: UserCreate) -> UserPublic:
        with self.uow as uow:
            if uow.usuarios.get_by_username(datos.username) is not None:
                raise UsuarioDuplicado("El nombre de usuario ya está registrado")
            if uow.usuarios.get_by_email(datos.email) is not None:
                raise UsuarioDuplicado("El email ya está registrado")
            try:
                usuario = uow.usuarios.add(
                    Usuario(
                        username=datos.username,
                        full_name=datos.full_name,
                        email=datos.email,
                        hashed_password=hash_password(datos.password),
                        role="user",
                    )
                )
            except IntegrityError:  # dos registros simultáneos con el mismo username o email
                raise UsuarioDuplicado("El nombre de usuario o el email ya están registrados")
            return UserPublic.model_validate(usuario)

    def login(self, username: str, password: str) -> str:
        """Devuelve el JWT. Primero credenciales (401) y después cuenta desactivada (400)."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            hash_a_verificar = usuario.hashed_password if usuario is not None else _HASH_FALSO
            clave_valida = len(password) <= MAX_PASSWORD and verify_password(password, hash_a_verificar)
            if usuario is None or not clave_valida:
                raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos")
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
            return create_access_token({"sub": str(usuario.id)})

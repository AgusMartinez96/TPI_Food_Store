from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import get_current_active_user
from app.modules.auth.schemas import MensajeRespuesta
from app.modules.auth.service import AuthService
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = "access_token"


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(datos: UserCreate, service: AuthService = Depends(get_auth_service)) -> UserPublic:
    try:
        return service.register(datos)
    except UsuarioDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.post("/token", response_model=MensajeRespuesta)
def login(
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
) -> MensajeRespuesta:
    token = service.login(form.username, form.password)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=False,  # desarrollo sobre http; en producción con HTTPS sería True
        path="/",
    )
    return MensajeRespuesta(message="Login exitoso")


@router.post("/logout", response_model=MensajeRespuesta)
def logout(response: Response) -> MensajeRespuesta:
    # mismos atributos que al crearla, si no el navegador no la reconoce como la misma cookie
    response.delete_cookie(COOKIE_NAME, httponly=True, samesite="lax", secure=False, path="/")
    return MensajeRespuesta(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(usuario: Usuario = Depends(get_current_active_user)) -> UserPublic:
    return UserPublic.model_validate(usuario)

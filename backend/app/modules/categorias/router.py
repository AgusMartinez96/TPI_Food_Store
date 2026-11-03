from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


@router.get("", response_model=list[CategoriaRead])
def listar_categorias(service: CategoriaService = Depends(get_categoria_service)) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{id}", response_model=CategoriaRead)
def obtener_categoria(id: int, service: CategoriaService = Depends(get_categoria_service)) -> CategoriaRead:
    try:
        return service.obtener(id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    datos: CategoriaCreate,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.crear(datos)
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.put("/{id}", response_model=CategoriaRead)
def actualizar_categoria(
    id: int,
    datos: CategoriaUpdate,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.actualizar(id, datos)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(
    id: int,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> Response:
    try:
        service.eliminar(id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.deps import require_role
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import CategoriaNoEncontrada, ProductoNoEncontrado, ProductoService
from app.modules.productos.unit_of_work import ProductoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())


@router.get("", response_model=ProductosPaginados)
def listar_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    disponible: Optional[bool] = None,
    service: ProductoService = Depends(get_producto_service),
) -> ProductosPaginados:
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{id}", response_model=ProductoRead)
def obtener_producto(id: int, service: ProductoService = Depends(get_producto_service)) -> ProductoRead:
    try:
        return service.obtener(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreate,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.crear(datos)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.put("/{id}", response_model=ProductoRead)
def actualizar_producto(
    id: int,
    datos: ProductoUpdate,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.actualizar(id, datos)
    except (ProductoNoEncontrado, CategoriaNoEncontrada) as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.patch("/{id}/stock", response_model=ProductoRead)
def actualizar_stock(
    id: int,
    datos: ProductoStockUpdate,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.actualizar_stock(id, datos)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    id: int,
    _admin: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> Response:
    try:
        service.eliminar(id)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

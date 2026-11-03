from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._activa(uow, categoria_id))

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            if uow.categorias.get_by_nombre(datos.nombre) is not None:
                raise NombreDuplicado(f"Ya existe una categoría con el nombre '{datos.nombre}'")
            categoria = uow.categorias.add(Categoria(nombre=datos.nombre, descripcion=datos.descripcion))
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._activa(uow, categoria_id)
            cambios = datos.model_dump(exclude_unset=True)
            if cambios.get("nombre") is None:
                cambios.pop("nombre", None)  # el nombre es obligatorio: null equivale a no enviarlo
            nombre = cambios.get("nombre")
            if nombre is not None and nombre != categoria.nombre:
                if uow.categorias.get_by_nombre(nombre) is not None:
                    raise NombreDuplicado(f"Ya existe una categoría con el nombre '{nombre}'")
            for campo, valor in cambios.items():
                setattr(categoria, campo, valor)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica. No cascadea a los productos ni libera el nombre."""
        with self.uow as uow:
            categoria = self._activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)

    @staticmethod
    def _activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(f"No existe la categoría {categoria_id}")
        return categoria

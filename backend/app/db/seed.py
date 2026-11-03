"""Seed idempotente: `python -m app.db.seed` (crea las tablas y solo inserta lo que falta)."""
from sqlmodel import select

from app.core.database import create_all_tables
from app.core.security import hash_password
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

CATEGORIAS: list[tuple[str, str]] = [
    ("Hamburguesas", "Hamburguesas artesanales con papas"),
    ("Pizzas", "Pizzas a la piedra"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Dulces para cerrar la comida"),
]

# (categoría, nombre, descripción, precio_base, stock, semilla de imagen)
PRODUCTOS: list[tuple[str, str, str, float, int, str]] = [
    ("Hamburguesas", "Hamburguesa clásica", "Carne, lechuga, tomate y cheddar", 8500.0, 25, "hamburguesa-clasica"),
    ("Hamburguesas", "Hamburguesa doble", "Doble carne, panceta y cheddar", 11200.0, 20, "hamburguesa-doble"),
    ("Hamburguesas", "Hamburguesa vegetariana", "Medallón de lentejas y vegetales", 9000.0, 15, "hamburguesa-veggie"),
    ("Pizzas", "Pizza muzzarella", "Salsa de tomate y muzzarella", 9800.0, 30, "pizza-muzzarella"),
    ("Pizzas", "Pizza napolitana", "Muzzarella, tomate fresco y ajo", 10800.0, 18, "pizza-napolitana"),
    ("Bebidas", "Gaseosa cola 500 ml", "Botella individual", 2200.0, 60, "gaseosa-cola"),
    ("Bebidas", "Agua mineral 500 ml", "Sin gas", 1500.0, 80, "agua-mineral"),
    ("Postres", "Flan casero", "Con dulce de leche y crema", 4200.0, 12, "flan-casero"),
    ("Postres", "Brownie con helado", "Brownie tibio y bocha de crema", 5600.0, 10, "brownie-helado"),
]


class SeedUnitOfWork(UnitOfWork):
    """El commit lo hace __exit__; el seed solo agrega entidades a la sesión."""


def run() -> None:
    create_all_tables()
    creados = {"usuarios": 0, "categorias": 0, "productos": 0}
    with SeedUnitOfWork() as uow:
        s = uow.session
        if s.exec(select(Usuario).where(Usuario.username == "admin")).first() is None:
            s.add(
                Usuario(
                    username="admin",
                    full_name="Administrador",
                    email="admin@foodstore.com",
                    hashed_password=hash_password("Admin1234!"),
                    role="admin",
                )
            )
            creados["usuarios"] += 1

        por_nombre: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS:
            categoria = s.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                s.add(categoria)
                s.flush()
                creados["categorias"] += 1
            por_nombre[nombre] = categoria

        for cat, nombre, descripcion, precio, stock, semilla in PRODUCTOS:
            if s.exec(select(Producto).where(Producto.nombre == nombre)).first() is None:
                s.add(
                    Producto(
                        categoria_id=por_nombre[cat].id,  # type: ignore[arg-type]
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                        imagen_url=f"https://picsum.photos/seed/{semilla}/400/300",
                    )
                )
                creados["productos"] += 1
    print(f"Seed OK. Creados ahora: {creados}")


if __name__ == "__main__":
    run()

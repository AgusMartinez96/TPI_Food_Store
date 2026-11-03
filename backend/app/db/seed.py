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

# Fotos de Wikimedia Commons (miniaturas de 500 px), verificadas una por una (HTTP 200, image/jpeg).
# La licencia y el autor van junto a cada URL; las CC BY / CC BY-SA exigen mencionar la autoría (ver README).
_COMMONS = "https://thumb.wikimedia.org/wikipedia/commons/thumb"
IMAGENES: dict[str, str] = {
    # Dominio público · Renee Comet
    "Hamburguesa clásica": f"{_COMMONS}/4/4d/Cheeseburger.jpg/500px-Cheeseburger.jpg",
    # CC BY-SA 4.0 · PattayaPatrol
    "Hamburguesa doble": f"{_COMMONS}/2/2e/DFC_2394_Double_cheeseburger_stacked_with_two_juicy_patties_melted_cheddar_crisp_lettuce_and_tomato_on_a_soft_sesame_bun.jpg/500px-DFC_2394_Double_cheeseburger_stacked_with_two_juicy_patties_melted_cheddar_crisp_lettuce_and_tomato_on_a_soft_sesame_bun.jpg",
    # CC0 · Andy Li
    "Hamburguesa vegetariana": f"{_COMMONS}/8/89/Plant-based_Cheeseburger_-_Depot_Cinema_and_Restaurant_2025-03-06.jpg/500px-Plant-based_Cheeseburger_-_Depot_Cinema_and_Restaurant_2025-03-06.jpg",
    # CC BY-SA 4.0 · Victor Manuel Giordano
    "Pizza muzzarella": f"{_COMMONS}/2/23/Pizza_with_mozzarella_%28argentine_style%29.jpg/500px-Pizza_with_mozzarella_%28argentine_style%29.jpg",
    # CC BY-SA 4.0 · Fabryx98
    "Pizza napolitana": f"{_COMMONS}/4/46/Pizza-napoletana.jpg/500px-Pizza-napoletana.jpg",
    # Dominio público · Ralf Roletschek
    "Gaseosa cola 500 ml": f"{_COMMONS}/e/e8/15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg/500px-15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg",
    # CC0 · Jiafei Slay Queen
    "Agua mineral 500 ml": f"{_COMMONS}/a/ad/Bottle_of_Water.jpg/500px-Bottle_of_Water.jpg",
    # CC BY-SA 4.0 · Pequeño mar
    "Flan casero": f"{_COMMONS}/5/5e/Flan_con_dulce_de_leche_y_crema.jpg/500px-Flan_con_dulce_de_leche_y_crema.jpg",
    # CC BY 2.0 · Ruth Hartnup
    "Brownie con helado": f"{_COMMONS}/e/ef/Chocolate_brownies_with_vanilla_ice_cream_%2843710445200%29.jpg/500px-Chocolate_brownies_with_vanilla_ice_cream_%2843710445200%29.jpg",
}

# (categoría, nombre, descripción, precio_base, stock)
PRODUCTOS: list[tuple[str, str, str, float, int]] = [
    ("Hamburguesas", "Hamburguesa clásica", "Carne, lechuga, tomate y cheddar", 8500.0, 25),
    ("Hamburguesas", "Hamburguesa doble", "Doble carne, panceta y cheddar", 11200.0, 20),
    ("Hamburguesas", "Hamburguesa vegetariana", "Medallón vegetal con vegetales frescos", 9000.0, 15),
    ("Pizzas", "Pizza muzzarella", "Salsa de tomate y muzzarella", 9800.0, 30),
    ("Pizzas", "Pizza napolitana", "Muzzarella, tomate fresco y ajo", 10800.0, 18),
    ("Bebidas", "Gaseosa cola 500 ml", "Botella individual", 2200.0, 60),
    ("Bebidas", "Agua mineral 500 ml", "Sin gas", 1500.0, 80),
    ("Postres", "Flan casero", "Con dulce de leche y crema", 4200.0, 12),
    ("Postres", "Brownie con helado", "Brownie tibio y bocha de crema", 5600.0, 10),
]


# Descripciones que el seed usaba antes. Si un producto todavía tiene EXACTAMENTE esa descripción se
# reemplaza por la nueva; si el admin la editó, se respeta.
DESCRIPCIONES_ANTERIORES: dict[str, str] = {
    "Hamburguesa vegetariana": "Medallón de lentejas y vegetales",
}


class SeedUnitOfWork(UnitOfWork):
    """El commit lo hace __exit__; el seed solo agrega entidades a la sesión."""


def run() -> None:
    create_all_tables()
    creados = {"usuarios": 0, "categorias": 0, "productos": 0, "imagenes_actualizadas": 0, "descripciones_actualizadas": 0}
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

        for cat, nombre, descripcion, precio, stock in PRODUCTOS:
            producto = s.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if producto is None:
                s.add(
                    Producto(
                        categoria_id=por_nombre[cat].id,  # type: ignore[arg-type]
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                        imagen_url=IMAGENES[nombre],
                    )
                )
                creados["productos"] += 1
            else:
                # Solo se corrigen la foto y, si sigue siendo la anterior del seed, la descripción.
                # Stock, precio y demás campos (que el admin pudo editar) no se tocan.
                if producto.imagen_url != IMAGENES[nombre]:
                    producto.imagen_url = IMAGENES[nombre]
                    s.add(producto)
                    creados["imagenes_actualizadas"] += 1
                if DESCRIPCIONES_ANTERIORES.get(nombre) == producto.descripcion:
                    producto.descripcion = descripcion
                    s.add(producto)
                    creados["descripciones_actualizadas"] += 1
    print(f"Seed OK. Creados ahora: {creados}")


if __name__ == "__main__":
    run()

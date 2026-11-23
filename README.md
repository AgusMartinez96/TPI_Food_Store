# Food Store

Trabajo Práctico Integrador de **Programación 4** (Tecnicatura Universitaria en Programación a Distancia, UTN).
Aplicación web de pedidos de comida: backend **FastAPI + SQLModel** y frontend **React + TypeScript**, dos proyectos independientes en este mismo repositorio.

| | |
|---|---|
| **Repositorio** | [github.com/AgusMartinez96/TPI_Food_Store](https://github.com/AgusMartinez96/TPI_Food_Store) |
| **Video de demostración** | [youtu.be/XySrapzEpF4](https://youtu.be/XySrapzEpF4) |
| **Autor** | Agustín Martínez |

## Qué hace

- **Clientes** (`user`): se registran, recorren el catálogo (búsqueda, filtro por categoría, paginación), arman un carrito que persiste en el navegador, confirman el pedido con dirección y forma de pago (efectivo o transferencia), y ven y cancelan sus pedidos mientras están `PENDIENTE`.
- **Administradores** (`admin`): panel con resumen del negocio, ABM de categorías y productos, stock y disponibilidad, gestión de pedidos (avanzar o cancelar según la máquina de estados) y de usuarios (activar y desactivar).
- **Reglas que garantiza el sistema**: un pedido se crea completo o no se crea (una sola transacción); el stock se descuenta al crear y se restituye al cancelar; los precios de un pedido no cambian después de creado; las bajas son lógicas.

Stack del backend: Python, FastAPI, SQLModel, PostgreSQL (o SQLite en desarrollo), JWT en cookie HttpOnly, bcrypt.
Stack del frontend: React 19, TypeScript (`strict`), Vite, Tailwind CSS 4, TanStack Query / Form / Table, React Router 7, Zustand, Axios.

## Requisitos

| Herramienta | Versión |
|---|---|
| Python | **3.11 a 3.13** (SQLModel no funciona con 3.14) |
| Node.js | 20.19 o superior |
| pnpm | 9 o superior (`npm install -g pnpm`) |
| PostgreSQL | 15 o superior — **opcional**: para desarrollo alcanza con SQLite |

Los comandos están pensados para **Windows PowerShell** (en macOS/Linux, el único cambio es activar el entorno con `source .venv/bin/activate`).

## Instalación y ejecución

Se usa `localhost` en todos lados (no `127.0.0.1`): la cookie de sesión es del host `localhost` y con otra dirección el navegador no la enviaría.

### 1. Backend (`http://localhost:8000`)

```powershell
cd backend
python --version                       # debe ser 3.11, 3.12 o 3.13
python -m venv .venv
.venv\Scripts\Activate.ps1             # si PowerShell lo bloquea: Set-ExecutionPolicy -Scope Process Bypass
pip install -r requirements.txt
Copy-Item .env.example .env
python -m app.db.seed                  # crea las tablas y carga el admin, 4 categorías y 9 productos (se puede repetir)
uvicorn app.main:app --reload
```

La documentación interactiva de la API queda en **http://localhost:8000/docs** (y `/redoc`).

> `python -m app.db.seed` crea las tablas por sí mismo, así que puede correr **antes** de levantar `uvicorn`. Es idempotente: repetirlo no duplica nada y solo completa la foto de un producto que ya existe si está vacía o si todavía tiene la URL anterior del seed (y la descripción de la hamburguesa vegetariana, si no la editaste). Lo que cambies desde el panel no se pisa.

**Base de datos.** Por defecto `.env.example` usa SQLite (`sqlite:///./foodstore.db`), que anda sin instalar nada. Para usar **PostgreSQL**:

1. Crear una base vacía: `CREATE DATABASE foodstore_db;`
2. En `backend/.env` cambiar la línea `DATABASE_URL` por `postgresql://USUARIO:CLAVE@localhost:5432/foodstore_db`
3. Correr de nuevo `python -m app.db.seed` y `uvicorn app.main:app --reload`.

### 2. Frontend (`http://localhost:5173`)

En otra terminal:

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env
pnpm dev                               # http://localhost:5173
```

Para verificar los tipos y generar el build de producción: `pnpm build` (corre `tsc -b` y `vite build`).

## Usuario del seed

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | `admin` |

Los clientes se crean desde la pantalla **Registrarse**. La contraseña admite entre 8 caracteres y 72 **bytes** (límite de bcrypt: una letra con tilde ocupa 2 bytes).

## Variables de entorno

**`backend/.env`** (copiar desde `backend/.env.example`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión completa a la base | `sqlite:///./foodstore.db` o `postgresql://usuario:clave@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Clave para firmar el JWT (**mínimo 32 caracteres**). Generá una propia: `python -c "import secrets; print(secrets.token_urlsafe(48))"` | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (con credenciales) | `http://localhost:5173` |

**`frontend/.env`** (copiar desde `frontend/.env.example`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

Los archivos `.env` no se suben al repositorio; solo los `.env.example`.

## Estructura

```
backend/            API FastAPI
  app/core/         config, base de datos, seguridad, dependencias, Unit of Work y BaseRepository
  app/modules/      auth · usuarios · categorias · productos · pedidos (router, service, unit_of_work, repository, models, schemas)
  app/db/seed.py    datos iniciales (idempotente)
frontend/           app React
  src/shared/       Axios, manejo de errores, componentes de UI y layout
  src/features/     auth · categorias · productos · usuarios · pedidos (pages, components, hooks, api, types)
  src/store/        authStore y cartStore (Zustand con persist)
  src/routes/       AppRouter y ProtectedRoute
docs/               documentación del proyecto
```

La arquitectura del backend es **Router → Service → Unit of Work → Repository → Model**: el commit ocurre únicamente en `UnitOfWork.__exit__` y ningún Service ni Router llama a `session.commit()`.

## Documentación

| Archivo | Contenido |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Objetivo, alcance, historias de usuario, reglas de negocio y decisiones |
| [docs/TRD.md](docs/TRD.md) | Decisiones técnicas, Unit of Work, autenticación, CORS, fechas y **limitaciones conocidas** |
| [docs/ESQUEMA_BACKEND.md](docs/ESQUEMA_BACKEND.md) | Modelo de datos, endpoints, schemas y repositorios |
| [docs/FLUJO.md](docs/FLUJO.md) | Diagramas de secuencia (login, crear pedido, cancelación) |
| [docs/DISENO.md](docs/DISENO.md) | Pantallas, rutas y componentes |
| [docs/PLAN_IMPLEMENTACION.md](docs/PLAN_IMPLEMENTACION.md) | Fases, tareas y trazabilidad con la rúbrica |
| [docs/GUION_VIDEO.md](docs/GUION_VIDEO.md) | Guion del video de demostración |

## Créditos de las imágenes

Las fotos de los productos del seed son miniaturas de [Wikimedia Commons](https://commons.wikimedia.org/), enlazadas directamente (no se copian al repositorio). Cada una conserva la licencia y la autoría de su archivo; las licencias CC BY y CC BY-SA exigen mencionar al autor.

| Producto | Archivo en Commons | Autor | Licencia |
|---|---|---|---|
| Hamburguesa clásica | [Cheeseburger.jpg](https://commons.wikimedia.org/wiki/File:Cheeseburger.jpg) | Renee Comet | Dominio público |
| Hamburguesa doble | [DFC 2394 Double cheeseburger…](https://commons.wikimedia.org/wiki/File:DFC_2394_Double_cheeseburger_stacked_with_two_juicy_patties_melted_cheddar_crisp_lettuce_and_tomato_on_a_soft_sesame_bun.jpg) | PattayaPatrol | CC BY-SA 4.0 |
| Hamburguesa vegetariana | [Plant-based Cheeseburger - Depot Cinema and Restaurant 2025-03-06.jpg](https://commons.wikimedia.org/wiki/File:Plant-based_Cheeseburger_-_Depot_Cinema_and_Restaurant_2025-03-06.jpg) | Andy Li | CC0 |
| Pizza muzzarella | [Pizza with mozzarella (argentine style).jpg](https://commons.wikimedia.org/wiki/File:Pizza_with_mozzarella_(argentine_style).jpg) | Victor Manuel Giordano | CC BY-SA 4.0 |
| Pizza napolitana | [Pizza-napoletana.jpg](https://commons.wikimedia.org/wiki/File:Pizza-napoletana.jpg) | Fabryx98 | CC BY-SA 4.0 |
| Gaseosa cola 500 ml | [Coca-Cola glass bottle (Germany)](https://commons.wikimedia.org/wiki/File:15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_(Germany).jpg) | Ralf Roletschek | Dominio público |
| Flan casero | [Flan con dulce de leche y crema.jpg](https://commons.wikimedia.org/wiki/File:Flan_con_dulce_de_leche_y_crema.jpg) | Pequeño mar | CC BY-SA 4.0 |
| Brownie con helado | [Chocolate brownies with vanilla ice cream (43710445200).jpg](https://commons.wikimedia.org/wiki/File:Chocolate_brownies_with_vanilla_ice_cream_(43710445200).jpg) | Ruth Hartnup | CC BY 2.0 |

La foto de "Agua mineral 500 ml" (`frontend/public/imagenes/agua-mineral-500ml.jpg`) es una foto de producto de la marca Crystal, usada con fines ilustrativos en este trabajo académico. **No tiene licencia libre**: la marca y la imagen pertenecen a sus titulares.

## Notas

- El proyecto no incluye pruebas automatizadas (están fuera del alcance de la consigna).
- Las limitaciones conocidas están en [docs/TRD.md §12](docs/TRD.md).

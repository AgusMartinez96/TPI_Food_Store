# PRD — Food Store (TPI Programación 4)

Qué se construye, para quién y qué reglas cumple. El cómo está en [TRD.md](TRD.md).

## 1. Objetivo

Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman un pedido (dirección de entrega + forma de pago: efectivo o transferencia). El negocio administra categorías, productos, stock, pedidos y usuarios desde un panel.

El sistema garantiza que **un pedido se crea completo o no se crea**, que el **stock se descuenta y se restituye de forma coherente** y que **los precios de un pedido no cambian** después de creado.

## 2. Alcance

- Autenticación con JWT en cookie HttpOnly y dos roles (`user`, `admin`).
- Catálogo con **una categoría por producto** (1:N) e imagen como URL.
- Carrito persistido en el navegador.
- Pedidos con máquina de 4 estados, descuento de stock en la transacción y restitución al cancelar.
- Pago manual, sin pasarela.
- Panel de administración: CRUD de categorías y productos, stock, pedidos, usuarios y resumen.
- CORS con credenciales, `.env.example`, seed idempotente, API documentada en `/docs` y `/redoc`.

**Fuera de alcance** (no se hace): direcciones guardadas por usuario, varias categorías por producto, historial de cambios de estado, gráficos, pasarela de pago, pruebas automatizadas, notificaciones. Tampoco: reactivar registros dados de baja, refresh tokens, Docker, Alembic.

## 3. Actores

| Actor | Objetivo |
|---|---|
| Cliente (`user`) | Navegar el catálogo, gestionar el carrito, confirmar pedido con dirección y forma de pago, consultar y cancelar sus pedidos (solo en `PENDIENTE`). |
| Administrador (`admin`) | Gestionar categorías, productos, stock y usuarios; avanzar o cancelar pedidos; ver el resumen. También puede crear pedidos como cualquier usuario. No puede desactivarse a sí mismo. |
| Sistema | Pedido atómico, stock coherente, precios inmutables. |

## 4. Historias de usuario

| ID | Historia | Criterio de aceptación |
|---|---|---|
| HU-01 | Como visitante me registro. | `POST /auth/register` crea `user`; 409 si `username` o `email` existen; contraseña ≥ 8; nunca se devuelve `hashed_password`. |
| HU-02 | Como usuario inicio y cierro sesión. | Login con `username` y `password`; cookie `access_token` HttpOnly; el cuerpo no trae el token; 401 credenciales incorrectas; 400 "Cuenta de usuario desactivada"; logout borra la cookie. |
| HU-03 | Como visitante recorro el catálogo. | Lista paginada en el servidor, búsqueda por nombre sin distinguir mayúsculas, filtro por categoría, skeleton al cargar, estado vacío. |
| HU-04 | Como visitante armo un carrito. | Agregar, quitar, cambiar cantidad, subtotal y total; persiste al recargar; "Agregar al carrito" deshabilitado sin stock o no disponible. |
| HU-05 | Como cliente confirmo un pedido. | Checkout con `direccion_entrega` (5–200), `forma_pago`, `notas`; `POST /pedidos`; vacía el carrito; redirige a "Mis pedidos". |
| HU-06 | Como cliente veo y cancelo mis pedidos. | Lista y detalle propios; cancelar solo en `PENDIENTE`; el stock se restituye. |
| HU-07 | Como admin gestiono categorías y productos. | ABM con TanStack Table y TanStack Form; baja lógica; cambio de stock y disponibilidad. |
| HU-08 | Como admin gestiono pedidos. | Tabla con filtro por estado; avanzar o cancelar según la máquina de estados. |
| HU-09 | Como admin gestiono usuarios. | Tabla con activar y desactivar; sin botón Desactivar en la fila propia. |
| HU-10 | Como admin veo el resumen. | Tarjetas con `pendientes`, `en_preparacion`, `entregados`, `cancelados`, `pedidos_hoy`, `ingresos_entregados`. |

## 5. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Crear pedido: al menos un ítem y ningún producto repetido. Cada producto debe existir, estar activo, disponible y con stock suficiente. Por cada ítem, **en la misma iteración**: se verifica, se descuenta el stock y se crea la línea copiando `nombre_producto` y `precio_unitario`. Se calculan subtotales y `total`; el pedido nace `PENDIENTE`. Todo en una transacción: si algo falla, no se persiste nada. |
| RN-02 | Transiciones solo las de la tabla (§6). Un estado terminal no admite cambios. Transición inválida → 400. |
| RN-03 | Cancelar restituye el stock de cada línea en la misma transacción que cambia el estado. |
| RN-04 | El cliente solo ve y cancela sus pedidos y solo desde `PENDIENTE`. El `admin` ve todos y avanza o cancela desde cualquier estado no terminal. |
| RN-05 | Las líneas y el `total` no cambian tras crear el pedido. No hay endpoint de edición ni de borrado de pedidos. |
| RN-06 | `forma_pago` ∈ {`EFECTIVO`, `TRANSFERENCIA`}; `direccion_entrega` entre 5 y 200 caracteres. Se validan en el schema. |

## 6. Máquina de estados

| Estado | Transiciones válidas | Quién |
|---|---|---|
| `PENDIENTE` | `EN_PREPARACION`, `CANCELADO` | admin avanza o cancela; el cliente dueño cancela |
| `EN_PREPARACION` | `ENTREGADO`, `CANCELADO` | admin |
| `ENTREGADO` | ninguna (terminal) | — |
| `CANCELADO` | ninguna (terminal) | — |

El mapa vive en `pedidos/service.py` como un diccionario; toda transición se valida antes de modificar el pedido.

## 7. Decisiones cerradas

Resueltas con el responsable del TPI. Son parte de la fuente de verdad.

### Backend

1. Python entre 3.11 y 3.13: se comprueba la versión antes de crear `backend/.venv`.
2. `Settings`: `DATABASE_URL` completa, `SECRET_KEY` (mínimo 32 caracteres), `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `FRONTEND_ORIGIN`. Soporta PostgreSQL y SQLite.
3. `localhost` siempre: `FRONTEND_ORIGIN=http://localhost:5173`, `VITE_API_URL=http://localhost:8000/api/v1`. CORS con origen explícito y `allow_credentials=True`.
4. Comando: `uvicorn app.main:app --reload` desde `backend/`. `python -m app.db.seed` crea las tablas por sí mismo y puede correr **antes** de levantar uvicorn.
5. Todos los modelos se importan antes de `create_all` y de configurar los mappers.
6. Rutas de colección exactas, sin barra final (evita 307).
7. Cookie `access_token`: HttpOnly, SameSite=Lax, `secure=False` en desarrollo, `max_age` según la expiración. El logout la borra con los mismos atributos.
8. Login: primero credenciales (401), después `disabled` (400, detail exacto `"Cuenta de usuario desactivada"`).
9. Un registro dado de baja responde 404 en detalle, PUT, PATCH y DELETE; repetir un DELETE da 404.
10. La baja de categoría no cascadea, no oculta sus productos y no libera el nombre: crear otra con ese nombre da 409.
11. PUT es parcial (`exclude_unset`).
12. `BaseRepository.get_by_id` no filtra por activo; esa regla va en el Service (así la cancelación restituye stock de un producto dado de baja).
13. RN-01: `ProductoRepetido` → 400; inexistente o inactivo → 404; no disponible o sin stock → 400. Precio y nombre salen siempre de la base, nunca del cliente.
14. `/pedidos/resumen` se declara antes de `/{id}`. `ingresos_entregados` devuelve 0 si no hay entregados.
15. `/pedidos/{id}/cancelar` es solo para el dueño: 403 si es ajeno, **aunque llame un admin**. El admin cancela pedidos ajenos con `/pedidos/{id}/estado`. Toda cancelación restituye stock en la misma transacción.
16. `updated_at` cambia en cada cambio de estado.
17. Activar y desactivar usuarios son idempotentes (200). La autodesactivación del admin da 400.

### Frontend

1. Estructura por features, con `shared/`, `store/` y `routes/`.
2. `authStore`: `usuario` (incluido `id`), `cargando`, `login`, `logout`, `checkSession`. `partialize` persiste solo `usuario`. `cargando` arranca en `true`.
3. El interceptor limpia `authStore` ante 401 fuera de `/auth/token` y `/auth/me`, y ante 400 con detail `"Cuenta de usuario desactivada"`.
4. `handleApiError` contempla `detail` como texto y como lista (422).
5. `GET /pedidos` devuelve todos al admin. `/mis-pedidos` filtra por `usuario_id === usuario.id`; `/admin/pedidos` muestra todos.
6. Crear o cancelar un pedido invalida también las queries de productos (cambia el stock).
7. "Agregar al carrito" se deshabilita sin stock o producto no disponible. Si una imagen falla, se muestra un reemplazo visual.
8. El catálogo pagina en el servidor con `skip = página × limit`. El panel usa `limit=100` y paginación de TanStack Table del lado del cliente.
9. Interfaz en español, simple, consistente y usable en celular.

## 8. Supuestos a confirmar

No contradicen la consigna ni las decisiones cerradas; son huecos que la consigna deja abiertos. Si no hay objeción, quedan así.

| # | Hueco | Resolución propuesta |
|---|---|---|
| S1 | "pedidos_hoy": ¿qué es "hoy"? | Las fechas se guardan en UTC, pero "hoy" se calcula desde la **medianoche de Argentina (UTC-3)**: `timezone(timedelta(hours=-3))`, sin dependencias nuevas. Esa medianoche se convierte a UTC naive para comparar con `created_at`. |
| S2 | `PATCH /productos/{id}/stock`: ¿ambos campos obligatorios? | Ambos opcionales (`exclude_unset`); se aplica lo enviado. `stock ≥ 0`. Cuerpo vacío = sin cambios (200). |
| S3 | El panel "pide `limit=100`" pero `GET /categorias` no pagina. | Categorías: lista completa sin parámetros. `limit=100` aplica a productos y pedidos. El panel muestra hasta 100 registros por lista. |
| S4 | ¿Dónde persiste `authStore` su `usuario`? | `sessionStorage` (solo el objeto usuario; el token nunca se guarda). `checkSession` revalida al montar. |
| S5 | Unicidad del nombre de categoría. | Comparación exacta (igual que la restricción UNIQUE de la base). |
| S6 | Transición al mismo estado (p. ej. `PENDIENTE`→`PENDIENTE`). | Inválida → 400. |
| S7 | Registros dados de baja. | No hay forma de reactivarlos desde la API ni el panel (la consigna no la pide); las listas del panel muestran solo activos. |
| S8 | `/mis-pedidos` para el admin. | Se piden hasta 100 pedidos, se filtra por `usuario_id` en el cliente y se pagina en el cliente. Para un `user` el servidor ya devuelve solo los suyos. |
| S9 | Versiones del frontend. | Se fijan las últimas estables que cumplan los rangos de la consigna (React 19.x, TS ≥ 5.9, Vite ≥ 7, Tailwind 4.x, Query 5.x, Form 1.x, Table 8.x, Router 7.x, Zustand 5.x, Axios 1.x), resueltas con `pnpm view` en la Fase 5. |

## 9. Criterios de evaluación

Se aprueba con 60 o más sobre 100, siempre que el proyecto corra siguiendo el `README.md` de la raíz (si no corre, se descuenta el 30 %). Detalle y trazabilidad por tarea en [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md).

| # | Criterio | Pts |
|---|---|---|
| 1 | Backend: estructura y configuración | 10 |
| 2 | Modelo de datos | 10 |
| 3 | Unit of Work y Repository | 10 |
| 4 | Autenticación y usuarios | 10 |
| 5 | API de catálogo | 10 |
| 6 | API de pedidos y reglas de negocio | 15 |
| 7 | Frontend: cliente | 10 |
| 8 | Frontend: panel de administración | 10 |
| 9 | Frontend: estado, datos y sesión | 10 |
| 10 | Calidad y entrega | 5 |

Formato de entrega: CE-01 `.zip` + URL del repositorio público · CE-02 `README.md` raíz · CE-03 `.env.example` de backend y frontend · CE-04 seed · CE-05 `pip install` + `uvicorn` + `/docs` · CE-06 `pnpm install`/`build`/`dev` · CE-07 video de 10 a 15 minutos.

**Lo que depende de la persona responsable (no de Claude):** grabar el video (CE-07), subirlo y poner su link, aprobar la publicación y crear el repositorio público (CE-01).

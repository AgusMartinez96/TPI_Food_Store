# PLAN DE IMPLEMENTACIÓN — Food Store

Fases, tareas y trazabilidad con la rúbrica (100 pts) y los ítems CE-01 a CE-07. Cada fase cierra igual: **verificar con evidencia → actualizar el estado en [CLAUDE.md](../CLAUDE.md) → commit local (sin `Co-Authored-By`) → resumen de 3 a 5 líneas**. Nada se da por funcionando sin mostrar la salida del comando o script.

Convención de verificación: scripts descartables en `.verify/` (fuera de git y del zip). Sin suite automatizada.

## Tareas por fase

### Fase 0 — Documentación
- [x] T0.1 Leer consigna completa, UML y TP9 (solo lectura).
- [x] T0.2 Escribir `CLAUDE.md`.
- [x] T0.3 Escribir `docs/PRD.md`, `TRD.md`, `FLUJO.md`, `DISENO.md`, `ESQUEMA_BACKEND.md` y este plan.
- [x] T0.4 `git init`, `.gitignore`, primer commit.
- **Frena: esperar aprobación.**

### Fase 1 — Backend base
- [x] T1.1 Verificar Python 3.11–3.13; crear `backend/.venv`; `requirements.txt` con versiones exactas.
- [x] T1.2 `core/config.py` (Settings, `SECRET_KEY` ≥ 32), `backend/.env.example`, `backend/.env` (SQLite + clave aleatoria).
- [x] T1.3 `core/database.py` (`engine`, `create_all_tables`, `session_factory`; SQLite con `check_same_thread` y FKs).
- [x] T1.4 `core/security.py` (bcrypt, `create_access_token`, `decode_access_token`).
- [x] T1.5 `core/unit_of_work.py` (`__enter__` abre sesión; `__exit__` commit/rollback/close).
- [x] T1.6 `core/base_repository.py` (`BaseRepository[T]`: `get_by_id`, `get_all`, `add`, `delete`).
- [x] T1.7 `models.py` de usuarios, categorias, productos y pedidos (5 entidades, `Relationship`/`back_populates` con nombres exactos) + `modules/__init__.py` importando los modelos.
- [x] T1.8 `app/main.py`: CORS con credenciales, prefijo `/api/v1`, lifespan con `create_all_tables`.
- [x] T1.9 `db/seed.py` idempotente (crea tablas; admin; ≥ 3 categorías; ≥ 8 productos con stock).
- [x] T1.10 **Verificar**: instalación limpia; seed ×2 sin duplicar; `uvicorn` levanta; `/docs` y `/redoc` responden.

### Fase 2 — Auth y usuarios
- [x] T2.1 `usuarios`: schemas (`UserCreate`, `UserPublic`), repository (`get_by_username`, `get_by_email`), unit_of_work, service (`UsuarioNoEncontrado`, `UsuarioDuplicado`), router.
- [x] T2.2 `core/deps.py`: `get_current_user` (cookie), `get_current_active_user`, `require_role`.
- [x] T2.3 `auth`: `POST /auth/register` (201, 409), `POST /auth/token` (cookie HttpOnly; 401 → 400), `POST /auth/logout`, `GET /auth/me`.
- [x] T2.4 `/admin/usuarios`: listado, `{id}/activar`, `{id}/desactivar` (idempotentes; 404; 400 autodesactivación).
- [x] T2.5 **Verificar** con script: registro 201, 409 por `username` y por `email`, 401, 400 desactivada (login y sesión), 403 de `user` en `/admin/*`, cookie con `HttpOnly`/`SameSite=Lax`/`Max-Age`, cuerpo sin token, `/me`, logout borra cookie, activar/desactivar ×2, autodesactivación 400.

### Fase 3 — Catálogo
- [x] T3.1 `categorias`: schemas, repository (`get_by_nombre`), UoW, service (`CategoriaNoEncontrada`, `NombreDuplicado`), router (`GET/POST /categorias`, `GET/PUT/DELETE /categorias/{id}`).
- [x] T3.2 `productos`: schemas (incl. `ProductoStockUpdate`, `ProductosPaginados`), repository (`search`), UoW (productos + categorias), service, router (incl. `PATCH /{id}/stock`).
- [x] T3.3 **Verificar** con script: verbos y códigos (201/200/204/404/409), baja lógica (detalle/PUT/PATCH/DELETE → 404; DELETE repetido 404), paginación (`skip`, `limit`, `total`), `search` sin distinguir mayúsculas, filtros `categoria_id` y `disponible`, PATCH de stock, categoría de baja no libera nombre (409) ni oculta productos, 403 a `user`.

### Fase 4 — Pedidos
- [x] T4.1 `pedidos`: schemas, repository (`list_by_usuario`, `count_by_estado`, listado total, hoy, ingresos), `PedidoUnitOfWork` (pedidos + productos).
- [x] T4.2 `service`: RN-01 (crear atómico), RN-02 (diccionario de transiciones), RN-03 (restituir stock), RN-04 (permisos), RN-05, RN-06; excepciones de dominio.
- [x] T4.3 `router`: `get_pedido_service`; `POST`, `GET`, `GET /resumen` (antes de `/{id}`), `GET /{id}`, `PATCH /{id}/estado`, `PATCH /{id}/cancelar`; traducción de excepciones.
- [x] T4.4 **Verificar** con script (mínimo): pedido correcto (total, líneas copiadas, stock descontado); **rollback completo** cuando falla el 2.º ítem (stock del 1.º intacto, sin pedido nuevo); repetido (400), inexistente (404), inactivo (404), no disponible (400), sin stock (400); todas las transiciones válidas e inválidas; restitución de stock al cancelar (dueño y admin, incluso de producto dado de baja); permisos (dueño, ajeno 403, admin ve todo, `cancelar` ajeno por admin 403); `updated_at` cambia; resumen correcto (incluido 0 sin entregados); precios inmutables tras cambiar `precio_base`.
- [x] T4.5 **Verificaciones estáticas**: `commit(` solo en `unit_of_work.py`; ningún router importa un UoW; todos los modelos de tabla fuera de `response_model`.
- [x] T4.6 Revisiones ECC del backend: **listar primero** lo instalado (no inventar comandos); correr `python-review`, `fastapi-review`, `security-review` y `code-review`; corregir solo problemas reales dentro del alcance (descartar pedidos de suite de pruebas).
- **Frena: mostrar resultado.**

### Fase 5 — Frontend base y cliente
- [ ] T5.1 Scaffold Vite + React + TS en `frontend/` con versiones de la consigna fijadas (`pnpm view`); `strict: true`; Tailwind 4 con `@tailwindcss/vite`; `frontend/.env.example`; `vite-env.d.ts`.
- [ ] T5.2 `shared/api`: `axiosInstance` (`withCredentials`, interceptor 401 y 400-desactivada), `handleApiError` (texto y lista), `queryClient`.
- [ ] T5.3 `shared/ui`, `shared/components`, `shared/layout`.
- [ ] T5.4 `store/authStore` (persist + partialize; `cargando` true; `checkSession`) y `store/cartStore` (persist).
- [ ] T5.5 `routes/AppRouter` y `ProtectedRoute` (por rol; indicador mientras `cargando`); `App.tsx` con `checkSession` (único `useEffect`).
- [ ] T5.6 `features/auth`: LoginPage, RegisterPage (TanStack Form), UnauthorizedPage.
- [ ] T5.7 `features/productos` (cliente): CatalogoPage, ProductoCard (botón deshabilitado, imagen de reemplazo), búsqueda, filtro por categoría, paginación en el servidor, skeleton, estado vacío.
- [ ] T5.8 `features/pedidos` (cliente): CarritoPage, CheckoutPage (TanStack Form, `POST /pedidos`, invalida pedidos y productos), MisPedidosPage (detalle, cancelar en `PENDIENTE`, filtro por `usuario_id`).
- [ ] T5.9 **Verificar**: `pnpm build` sin errores.

### Fase 6 — Panel de administración
- [ ] T6.1 AdminResumenPage (tarjetas).
- [ ] T6.2 AdminCategoriasPage (TanStack Table + Form; baja lógica).
- [ ] T6.3 AdminProductosPage (TanStack Table + Form; cambio de stock y disponibilidad).
- [ ] T6.4 AdminPedidosPage (filtro por estado; avanzar/cancelar según la máquina de estados).
- [ ] T6.5 AdminUsuariosPage (activar/desactivar; sin Desactivar en la fila propia).
- [ ] T6.6 **Verificar**: `pnpm build`.

### Fase 7 — Integración y calidad
- [ ] T7.1 `pnpm build` sin errores; `grep -rnw any frontend/src`; `grep -rn "useEffect" frontend/src` (solo `App.tsx`); `grep -rn "fetch(" frontend/src` (nada).
- [ ] T7.2 Probar de punta a punta los flujos posibles (backend + frontend levantados, navegador si hay herramienta). Si no se puede operar un navegador: `docs/VERIFICACION_MANUAL.md` con los pasos, marcado **pendiente de prueba manual**.
- [ ] T7.3 Revisiones ECC del frontend (listar primero; corregir solo lo real y dentro del alcance).
- **Frena: pedir que cambies `DATABASE_URL` en `backend/.env` a PostgreSQL (vos escribís la contraseña).**
- [ ] T7.4 Repetir seed ×2 y la verificación de pedidos (T4.4) sobre PostgreSQL.

### Fase 8 — Entrega
- [ ] T8.1 `README.md` de la raíz: requisitos, instalación y ejecución de backend y frontend, variables de entorno, usuario `admin` del seed, y lugares marcados para la **URL del repositorio** y el **link del video**.
- [ ] T8.2 `docs/GUION_VIDEO.md` (10 a 15 min, según CE-07).
- [ ] T8.3 Probar el README en **copia limpia** (venv nuevo, `pip install`, seed, `uvicorn`, `pnpm install`, `pnpm build`).
- [ ] T8.4 Generar `Martinez_Agustin_TPI_Food_Store.zip` (sin `node_modules`, `venv`, `.venv`, `.env`, `.verify`, `.git`, `dist`, `__pycache__`).
- [ ] T8.5 Tabla final de la rúbrica de 100 puntos: criterio, estado, evidencia y lo que le queda a la persona responsable.

## Trazabilidad: rúbrica → tareas → evidencia

| # | Criterio | Pts | Tareas | Evidencia prevista |
|---|---|---|---|---|
| 1 | Backend: estructura y configuración | 10 | T1.1–T1.9, T8.3 | Árbol por módulos y `core/`; `.env.example`; `requirements.txt` con pines (`bcrypt==4.0.1`); CORS con credenciales; seed ×2 sin duplicar (T1.10) |
| 2 | Modelo de datos | 10 | T1.7, T4.1, T4.2 | 5 entidades con campos, defaults y `Relationship` exactos; baja lógica; `DetallePedido` copia nombre y precio (T4.4: precio inmutable); ningún borrado de pedidos |
| 3 | Unit of Work y Repository | 10 | T1.5, T1.6, T2.1, T3.1, T3.2, T4.1, T4.5 | `grep commit(` solo en `unit_of_work.py`; Services con `with self.uow as uow:` devolviendo schema dentro; routers sin UoW; repos sin reglas de negocio |
| 4 | Autenticación y usuarios | 10 | T2.1–T2.5 | Script T2.5: 409/401/400/403/404; cookie HttpOnly; sin token en cuerpo; gestión de usuarios |
| 5 | API de catálogo | 10 | T3.1–T3.3 | Script T3.3: verbos, códigos, `search`, `categoria_id`, paginación, PATCH stock, DELETE 204 lógico |
| 6 | API de pedidos y reglas de negocio | 15 | T4.1–T4.6 | Script T4.4: RN-01 a RN-06, rollback, restitución, resumen |
| 7 | Frontend: cliente | 10 | T5.6–T5.8, T5.9 | Login/registro con TanStack Form; catálogo con búsqueda, filtro, paginación, skeleton y vacío; carrito persistido; checkout; mis pedidos con detalle y cancelar |
| 8 | Frontend: panel de administración | 10 | T6.1–T6.6 | ABM con TanStack Table + Form; stock; pedidos con cambio de estado; usuarios; resumen con tarjetas |
| 9 | Frontend: estado, datos y sesión | 10 | T5.2, T5.4, T5.5, T7.1 | Query para todos los datos del servidor con invalidación; stores tipados con `persist`; Axios con `withCredentials` e interceptor; `ProtectedRoute` por rol; greps de `fetch`/`useEffect` |
| 10 | Calidad y entrega | 5 | T7.1, T8.1–T8.5 | `strict: true` y cero `any`; README probado en copia limpia; marcador de URL del repo |

## Trazabilidad: formato de entrega (CE)

| CE | Requisito | Tareas | Responsable del cierre |
|---|---|---|---|
| CE-01 | `.zip` (sin `node_modules`, `venv`, `.env`) y repositorio público con la URL en el README | T8.4 (zip), T8.1 (marcador de URL) | Claude: zip y marcador. **Vos**: crear el repo público, subirlo y pegar la URL |
| CE-02 | `README.md` raíz: requisitos, instalación, ejecución, variables, usuario admin | T8.1, T8.3 | Claude |
| CE-03 | `backend/.env.example` y `frontend/.env.example` completos | T1.2, T5.1 | Claude |
| CE-04 | `python -m app.db.seed` carga admin, categorías y productos | T1.9, T1.10, T7.4 | Claude |
| CE-05 | `pip install -r requirements.txt` y `uvicorn app.main:app` sin errores; `/docs` muestra todos los endpoints | T1.10, T8.3 | Claude |
| CE-06 | `pnpm install`, `pnpm build` y `pnpm dev` sin errores | T5.1, T7.1, T8.3 | Claude |
| CE-07 | Video de 10 a 15 min: presentación con cámara, registro, compra como cliente, gestión como admin y cancelación con restitución de stock | T8.2 (guion) | **Vos**: grabar, subir y pegar el link en el README |

## Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| El proyecto no corre siguiendo el README (−30 %) | T8.3: probar en copia limpia |
| `bcrypt` ≥ 5 rompe Passlib | Pines `passlib[bcrypt]==1.7.4` y `bcrypt==4.0.1`; se verifica con el registro/login |
| Mappers sin resolver (`Relationship` por nombre) | `modules/__init__.py` importa todos los modelos; el seed corre solo (T1.10) |
| Redirecciones 307 por barra final | Rutas de colección con `""`; script T3.3 las llama sin barra |
| Cookie que no viaja | `localhost` en todos lados; CORS con origen explícito y credenciales |
| Stock inconsistente en cancelación | Restitución dentro del mismo UoW; probada con producto dado de baja (T4.4) |
| PostgreSQL distinto de SQLite | T7.4 repite seed y verificación de pedidos sobre PostgreSQL |

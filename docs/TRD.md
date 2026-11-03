# TRD — Food Store

Cómo se construye. Qué se construye está en [PRD.md](PRD.md); entidades y endpoints en [ESQUEMA_BACKEND.md](ESQUEMA_BACKEND.md).

## 1. Stack y política de versiones

Toda dependencia va con **versión exacta** (`==` en `requirements.txt`; sin `^` ni `~` en `package.json`), dentro de los rangos de la consigna. Las versiones concretas se resuelven en la fase donde se instalan y se anotan en el archivo correspondiente.

| Capa | Tecnología | Rango de la consigna |
|---|---|---|
| Lenguaje | Python | 3.11 a 3.13 (SQLModel 0.0.22 no anda con 3.14). Entorno actual: 3.11.9 |
| API | `fastapi[standard]` | ≥ 0.115 |
| ORM | `sqlmodel` | ≥ 0.0.22 |
| Base | PostgreSQL ≥ 15 con `psycopg2-binary` | 2.9.x. SQLite aceptada en desarrollo |
| JWT | `python-jose[cryptography]` | **3.5.0** |
| Hash | `passlib[bcrypt]` + `bcrypt` | **1.7.4** y **4.0.1** (Passlib falla con bcrypt 5) |
| Config | `pydantic-settings`, `python-multipart` | 2.x; 0.0.20 |
| Frontend | Node ≥ 20.19, pnpm ≥ 9, React 19.x, TypeScript ≥ 5.9, Vite ≥ 7, Tailwind 4.x + `@tailwindcss/vite` | — |
| Datos en cliente | TanStack Query 5.x, Form 1.x, Table 8.x · react-router-dom 7.x · Zustand 5.x · Axios 1.x | — |

Entorno de desarrollo verificado: Node 25.9.0, pnpm 10.33.0, git 2.49.0. Con pnpm 10 hay que aprobar los scripts de build (p. ej. `esbuild`) con `pnpm.onlyBuiltDependencies` en `package.json`.

## 2. Arquitectura en capas (backend)

```
Router ──> Service ──> UnitOfWork ──> Repository ──> Model
 HTTP       reglas       sesión +       select()      tablas
            de negocio   commit/rollback
```

El flujo de dependencias es unidireccional: ninguna capa importa de la capa superior.

| Capa | Archivo | Responsabilidad | Conoce a |
|---|---|---|---|
| Router | `router.py` | Valida el cuerpo con schemas, resuelve sesión y rol con `Depends`, delega al Service, traduce excepciones de dominio a `HTTPException` con `try/except`. | Service |
| Service | `service.py` | Reglas de negocio. Abre `with self.uow as uow:` y **devuelve el schema de salida dentro del bloque**. Define las excepciones de dominio. | UnitOfWork |
| Unit of Work | `unit_of_work.py` | Crea la sesión, expone los repositorios que comparten esa sesión, hace commit o rollback en `__exit__`. | Repository, Session |
| Repository | `repository.py` | Consultas con `select`. Hereda de `BaseRepository[T]`. Sin reglas de negocio. | Model, Session |
| Model | `models.py` | Tablas SQLModel (`table=True`) y `Relationship`. | — |
| Schemas | `schemas.py` | Entrada y salida (SQLModel **sin** `table=True`). | — |

`auth` solo tiene `router.py`, `service.py` y `schemas.py` (usa el modelo `Usuario`). `usuarios` tiene la cadena completa. Como la consigna lo permite, `auth` y `usuarios` pueden lanzar `HTTPException` directo desde el Service para 401 y 400 de login; las excepciones con nombre de la consigna (`UsuarioNoEncontrado`, `UsuarioDuplicado`) se definen igual en `usuarios/service.py`.

### 2.1 Unit of Work

```python
class UnitOfWork:
    def __enter__(self):          # abre Session(engine, expire_on_commit=False) y crea los repositorios
    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                self.session.commit()    # ← ÚNICO commit de todo el backend
            else:
                self.session.rollback()
        finally:
            self.session.close()
```

- Cada módulo con repositorios propios define `<Modulo>UnitOfWork(UnitOfWork)` y expone sus repos (`uow.categorias`, `uow.productos`, `uow.pedidos`, `uow.usuarios`).
- `PedidoUnitOfWork` expone `pedidos` **y** `productos` sobre la **misma sesión**: es lo que hace atómico el descuento de stock.
- `ProductoUnitOfWork` expone `productos` y `categorias` (para validar la categoría).
- Un `UnitOfWork` se crea por petición (en `get_<modulo>_service`), así no hay estado compartido entre requests.
- Los repositorios hacen `flush()` (no commit) para obtener ids y que las consultas siguientes vean los cambios.
- Una excepción (de dominio o `HTTPException`) dentro del bloque → rollback; luego el Router la traduce. Nada se persiste.
- Verificación estática: `grep -rn "commit(" backend/app` debe devolver **solo** `core/unit_of_work.py`.

### 2.2 BaseRepository

`BaseRepository[T]` con `get_by_id`, `get_all`, `add`, `delete` (nombres exactos de la consigna). `add` hace `flush`. `get_by_id` **no** filtra por `activo`. `delete` existe por contrato pero ningún endpoint lo usa (todo es baja lógica).

### 2.3 Registro de modelos

SQLModel resuelve los `Relationship("Clase")` por nombre al configurar los mappers; si falta importar un módulo, falla en la primera consulta. Para evitarlo, `app/modules/__init__.py` importa los `models.py` de los cuatro módulos (cualquier `import app.modules.x` lo ejecuta antes) y `create_all_tables()` importa `app.modules`. Así `python -m app.db.seed`, `uvicorn` y los scripts de `.verify/` ven siempre el modelo completo.

## 3. Autenticación y autorización

- **Contraseñas**: bcrypt vía Passlib (`hash_password`, `verify_password`).
- **JWT**: `create_access_token(data)` firma `{"sub": str(usuario.id), "exp", "type": "access"}` con `SECRET_KEY` y `ALGORITHM`; `decode_access_token` devuelve el payload o `None` (firma, vencimiento o tipo inválidos). `algorithms=[settings.ALGORITHM]` fijo.
- **Cookie** `access_token` en `POST /auth/token`: `httponly=True`, `samesite="lax"`, `secure=False` (desarrollo; en producción con HTTPS sería `True`), `path="/"`, `max_age = ACCESS_TOKEN_EXPIRE_MINUTES * 60`. El cuerpo es `{"message": "Login exitoso"}`: **nunca** el token. El logout hace `delete_cookie` con los mismos atributos.
- **Lectura**: un `OAuth2PasswordBearer` propio lee el token **solo** de la cookie (ignora `Authorization`), con `auto_error=False` para controlar el 401.
- **Dependencias** (`core/deps.py`):
  - `get_current_user` → 401 si falta la cookie, el token es inválido/vencido o el usuario no existe.
  - `get_current_active_user` → 400 `"Cuenta de usuario desactivada"` si `disabled`.
  - `require_role(["admin"])` → 403 si el rol no está permitido.
- **Orden del login**: buscar usuario por `username`, verificar contraseña (401 `"Usuario o contraseña incorrectos"`; mismo mensaje para usuario inexistente, así no se filtra qué usuarios existen) y recién después `disabled` (400).
- **CORS**: `CORSMiddleware(allow_origins=[settings.FRONTEND_ORIGIN], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])`. Con credenciales no se puede usar `*`.
- **Por qué `localhost`**: la cookie es del host `localhost`; con `127.0.0.1` el navegador la trataría como otro sitio y no viajaría.

## 4. Configuración y entorno

`core/config.py` (`pydantic-settings`, lee `backend/.env`, `extra="ignore"`):

| Variable | Valor de ejemplo | Notas |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./foodstore.db` / `postgresql://user:pass@localhost:5432/foodstore_db` | URL completa. Con SQLite se usa `check_same_thread=False` y `PRAGMA foreign_keys=ON`. |
| `SECRET_KEY` | (aleatoria, ≥ 32 car.) | Validador: menos de 32 caracteres → no arranca. |
| `ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Vida del token **y** de la cookie. |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origen CORS. |

`backend/.env.example` lleva valores de muestra (la `SECRET_KEY` de ejemplo es un texto obvio de reemplazar, sin secreto real). `backend/.env` lo genera Claude con SQLite y una clave aleatoria; **no se versiona**. Para PostgreSQL, la persona responsable edita `DATABASE_URL` y escribe su contraseña; Claude no la pide ni la escribe en archivos versionados.

Frontend: `frontend/.env.example` con `VITE_API_URL=http://localhost:8000/api/v1`. `axiosInstance` usa `import.meta.env.VITE_API_URL` (con `vite-env.d.ts` tipando la variable).

## 5. Base de datos

- Tablas con `SQLModel.metadata.create_all` (sin Alembic). `create_all_tables()` es idempotente.
- `database.py`: `engine`, `create_all_tables`, `session_factory`.
- **Seed idempotente** (`python -m app.db.seed`): crea las tablas por sí mismo; inserta solo lo que falta (admin por `username`, categorías por `nombre`, productos por `nombre`). Corrido dos veces no duplica. Crea `admin` / `Admin1234!` (rol `admin`), ≥ 3 categorías y ≥ 8 productos con stock.
- Restricciones de rango (`≥ 0`, `≥ 1`, largos, valores permitidos) se validan en schemas con `Field` y en el Service; no se agregan `CHECK` en la base (lo dice la consigna). Únicos con `unique=True`: `Usuario.username`, `Usuario.email`, `Categoria.nombre`.
- Los modelos de tabla **nunca** se devuelven: siempre schemas de lectura (`Modelo.model_validate(obj)` dentro del bloque del UoW).

## 6. Pedidos: atomicidad y concurrencia

El flujo de crear pedido está en [FLUJO.md](FLUJO.md). Puntos técnicos:

- Todo ocurre dentro de un único `with self.uow as uow:`; el commit lo hace `__exit__`. Si el segundo ítem falla, la excepción sale del bloque, el rollback deshace el `INSERT` del pedido y el descuento del primer ítem.
- Subtotales y `total` con `round(x, 2)`.
- Cancelar (por dueño o por admin) recorre `pedido.items`, busca cada producto con `get_by_id` (sin filtrar por activo) y suma `cantidad` al stock, todo antes del commit.
- **Limitación conocida (documentada, no se resuelve)**: la verificación de stock es "leer, comparar, descontar". Con PostgreSQL y dos pedidos simultáneos sobre el mismo producto podría sobrevender; evitarlo exigiría bloqueo de filas (`FOR UPDATE`), que la consigna no pide.

## 7. Errores

Todo error responde `HTTPException` con `detail`. Códigos comunes: 401 (sin sesión válida), 400 "Cuenta de usuario desactivada", 403 (rol), 422 (schema). El Router traduce así:

| Excepción de dominio (en `service.py`) | Código |
|---|---|
| `CategoriaNoEncontrada`, `ProductoNoEncontrado`, `PedidoNoEncontrado`, `UsuarioNoEncontrado` | 404 |
| `NombreDuplicado`, `UsuarioDuplicado` | 409 |
| `PedidoAjeno` | 403 |
| `StockInsuficiente`, `ProductoNoDisponible`, `ProductoRepetido`, `TransicionInvalida`, y demás reglas de negocio | 400 |

Cada excepción lleva un mensaje en español que el Router pasa como `detail`. No hay handlers globales (`app.exception_handler`) para excepciones de dominio.

## 8. Fechas

`created_at` y `updated_at` se guardan como `datetime` **UTC naive** (`datetime.now(timezone.utc).replace(tzinfo=None)`), igual en SQLite y PostgreSQL. El JSON las serializa sin sufijo de zona. El frontend, en un único helper de formato, agrega `Z` cuando falta antes de `new Date(...)`, así se muestran en hora local del navegador. `pedidos_hoy` cuenta `created_at >= medianoche de Argentina` (supuesto S1): `ARG = timezone(timedelta(hours=-3))`; `inicio = datetime.now(ARG).replace(hour=0, minute=0, second=0, microsecond=0)`; se pasa a UTC (`inicio.astimezone(timezone.utc).replace(tzinfo=None)`) para comparar con la columna. Sin `zoneinfo` ni dependencias nuevas.

## 9. Frontend

- **Estado del servidor**: TanStack Query. Un `queryClient` único (`shared/api/queryClient.ts`) con `retry: 1`, `refetchOnWindowFocus: false`. `queryKey` descriptivas: `['productos', filtros]`, `['categorias']`, `['pedidos', filtros]`, `['pedidos', 'resumen']`, `['usuarios']`. Mutaciones con `invalidateQueries` en `onSuccess`. Crear o cancelar pedido invalida también `['productos']`.
- **Estado del cliente**: Zustand con `persist`. `authStore` (partialize → solo `usuario`; `cargando` arranca en `true`); `cartStore` (ítems persistidos en `localStorage`; `total` calculado).
- **Cliente HTTP**: una instancia Axios (`withCredentials: true`, `baseURL = VITE_API_URL`). Interceptor de respuesta: 401 fuera de `/auth/token` y `/auth/me`, o 400 con detail `"Cuenta de usuario desactivada"` → `authStore` se limpia (y se vacía la caché de Query). `ProtectedRoute` redirige a `/login` al quedar sin usuario. El interceptor no navega. (Dependencia circular `authStore` ↔ `axiosInstance`: es segura porque ambos solo se usan dentro de funciones, no al evaluar el módulo.)
- **`handleApiError(error: unknown): string`**: `detail` string → tal cual; `detail` lista (422) → mensajes unidos; error de red → mensaje genérico; resto → mensaje por defecto.
- **Sesión**: `App.tsx` llama `checkSession` en el **único** `useEffect` con efecto de datos. Mientras `cargando` es `true`, `ProtectedRoute` muestra un indicador.
- **Formularios**: TanStack Form con validación de campo (`validators`), sin librería de esquemas extra.
- **Tablas**: TanStack Table con `getCoreRowModel` + `getPaginationRowModel` (paginación en el cliente sobre `limit=100`).
- **TypeScript**: `strict: true`, sin `any`; los `types/` espejan los schemas del backend con los mismos nombres de campo. Verificación: `pnpm build` (que corre `tsc -b`) y `grep -rnw any frontend/src`.
- **Datos fuera de `useEffect`**: todo `useQuery`/`useMutation`. Verificación: `grep -rn "useEffect" frontend/src` solo debe mostrar `App.tsx`; `grep -rn "fetch(" frontend/src` sin resultados.

## 10. Verificación y herramientas de revisión

- **Sin suite automatizada.** Scripts descartables en `.verify/` (ignorada por git, excluida del zip): usan `fastapi.testclient.TestClient` o `httpx` contra el servidor, imprimen `PASS`/`FAIL` con el código HTTP y salen con código ≠ 0 si algo falla. Para probar el rollback usan una base SQLite temporal y comparan stock antes y después.
- **Revisiones ECC** (se listan antes de usarlas; no se inventan comandos): backend al final de la Fase 4 (`ecc:python-review`, `ecc:fastapi-review`, `ecc:security-review`/`ecc:security-reviewer`, `ecc:code-review`); frontend al final de la Fase 7 (`ecc:react-review`, `ecc:typescript-reviewer`). Solo se corrigen problemas reales dentro del alcance; las sugerencias de agregar pruebas automatizadas se descartan.
- **Navegador**: si hay herramientas de navegador disponibles (Playwright CLI / Chrome DevTools de ECC) se prueban de punta a punta los flujos; si no, queda `docs/VERIFICACION_MANUAL.md` marcado como **pendiente de prueba manual**.

## 11. Comandos de Windows

Están en [CLAUDE.md](../CLAUDE.md) (sección "Comandos"). Notas para PowerShell: activar el venv con `.venv\Scripts\Activate.ps1` (si la política lo bloquea: `Set-ExecutionPolicy -Scope Process Bypass`); copiar con `Copy-Item`; no hay `&&` en Windows PowerShell 5.1.

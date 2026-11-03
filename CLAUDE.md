# CLAUDE.md — TPI Food Store (Programación 4)

Punto de entrada. Leer esto primero; después, solo los documentos que hagan falta para la tarea.

## Qué es

Food Store: app web de pedidos de comida. Backend FastAPI + SQLModel (`backend/`) y frontend React + TypeScript (`frontend/`), dos proyectos independientes en un solo repositorio, con `README.md` en la raíz. Objetivo: puntaje máximo en la rúbrica (100 pts) y los ítems CE-01 a CE-07.

## Jerarquía de la fuente de verdad

1. `docs/consigna/TPI_Food_Store.pdf` manda sobre todo.
2. `docs/consigna/UML_Food_Store TPI.svg` define entidades, campos y relaciones.
3. Las "Decisiones cerradas" de [docs/PRD.md](docs/PRD.md) (sección 7).
4. Si hay una contradicción o ambigüedad que no esté resuelta ahí: **frenar y preguntar**. No inventar.

La carpeta `D:\Programacion_4\TP_Integrador_Unidad_9` (TP9) es referencia de **solo lectura**: nunca se modifica. Se reutiliza únicamente lo que coincide con la consigna (cookie HttpOnly, Axios, Zustand, patrones de TanStack, UoW y repositorios).

## Qué leer

| Si vas a… | Leé |
|---|---|
| Entender alcance, reglas, decisiones cerradas | [docs/PRD.md](docs/PRD.md) |
| Decidir cómo se construye algo (stack, UoW, cookie, CORS, fechas) | [docs/TRD.md](docs/TRD.md) |
| Ver el orden de las interacciones (login, pedido, cancelación) | [docs/FLUJO.md](docs/FLUJO.md) |
| Tocar pantallas, rutas, componentes | [docs/DISENO.md](docs/DISENO.md) |
| Tocar modelos, endpoints, schemas, repositorios | [docs/ESQUEMA_BACKEND.md](docs/ESQUEMA_BACKEND.md) |
| Saber qué sigue y cómo se verifica | [docs/PLAN_IMPLEMENTACION.md](docs/PLAN_IMPLEMENTACION.md) |

## Reglas clave (no negociables)

Backend
- Commit **solo** en `UnitOfWork.__exit__` (sin excepción). Ningún Service ni Router llama `session.commit()`. `flush` sí está permitido.
- Router: obtiene el Service con `Depends(get_<modulo>_service)` y **nunca** abre el UoW.
- `categorias`, `productos`, `pedidos`: el Service abre `with self.uow as uow:` y devuelve el schema **dentro** del bloque.
- Excepciones de dominio definidas en cada `service.py`; el Router las traduce con `try/except` a `HTTPException`.
- Nunca exponer modelos de tabla ni `hashed_password`. El token nunca va en el cuerpo ni se guarda en el navegador.
- Rutas de colección exactas, sin barra final (`/categorias`, no `/categorias/`). Todo bajo `/api/v1`.
- `BaseRepository.get_by_id` **no** filtra por activo; esa regla va en el Service.
- Baja lógica en todo: repetir un `DELETE` da 404. Nada de borrado físico.

Frontend
- TypeScript `strict: true`, cero `any`. Ningún `fetch` ni dato del servidor en `useEffect`: el único `useEffect` de datos es `checkSession` en `App.tsx`.
- Todo pedido HTTP pasa por la instancia de Axios (`withCredentials: true`). Nada de `fetch` propio.
- Siempre `localhost`, nunca `127.0.0.1` (si no, la cookie no viaja).

General
- Dependencias fijadas con versión exacta (incluidas `passlib[bcrypt]==1.7.4`, `bcrypt==4.0.1`, `python-jose[cryptography]==3.5.0`), dentro de los rangos de la consigna.
- **Sin suite de pruebas automatizadas** (fuera de alcance). Verificar con scripts temporales en `.verify/` (ignorada por git y excluida del `.zip`).
- Hacer solo lo pedido: nada de "Fuera de alcance", abstracciones extra ni dependencias ajenas al stack.
- Commits locales, **sin** `Co-Authored-By`. Nunca push ni crear el repo remoto sin permiso.
- Nunca pedir ni escribir la contraseña de PostgreSQL en un archivo versionado. `backend/.env` no se versiona.
- No declarar nada como funcionando sin mostrar la evidencia del comando o script ejecutado.
- **Procesos**: nunca usar `taskkill` por nombre de imagen (p. ej. `python.exe`). Cortar únicamente procesos que inicié yo en esta sesión, identificados por PID (confirmar la línea de comandos antes de `Stop-Process -Id`).

## NO arrastrar del TP8/TP9

Ingredientes · Producto–Categoría N:M (ahora 1:N) · endpoint `/pedido` · estados en minúscula · handlers globales de excepciones de dominio · `backend/main.py` · endpoints sin `/api/v1` · `/auth/admin/usuarios` (ahora `/admin/usuarios`) · `fetch` propio en vez de Axios · `ProductoRepetido` como 422 (ahora 400) · entrega en dos `.zip` (ahora uno).

## Frenar y preguntar antes de

Agregar una dependencia fuera del stack · cambiar el esquema respecto del UML · borrar archivos que no creé en esta sesión · tocar algo fuera de `D:\Programacion_4\TPI_Food_Store` · crear el repo remoto, hacer push o publicar · seguir tras 3 intentos fallidos con la misma causa (mostrar error, lo probado y la hipótesis).

## Comandos (Windows, PowerShell, desde la raíz del repo)

Backend (`backend/`):

```powershell
cd backend
python --version                       # debe ser 3.11 a 3.13
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env            # completar SECRET_KEY (>= 32 caracteres)
python -m app.db.seed                  # crea tablas y datos; idempotente; corre ANTES de uvicorn
uvicorn app.main:app --reload          # http://localhost:8000/docs  y  /redoc
```

Frontend (`frontend/`):

```powershell
cd frontend
pnpm install
Copy-Item .env.example .env            # VITE_API_URL=http://localhost:8000/api/v1
pnpm dev                               # http://localhost:5173
pnpm build                             # tsc -b && vite build
```

Verificación temporal (scripts descartables, nunca versionados):

```powershell
cd backend
.venv\Scripts\python.exe ..\.verify\verificar_<tema>.py
```

Usuario admin del seed: `admin` / `Admin1234!`.

## Estado actual

- [x] Fase 0: documentación (aprobada; S1 ajustado: `pedidos_hoy` desde medianoche UTC-3)
- [x] Fase 1: backend base
- [x] Fase 2: auth y usuarios
- [ ] Fase 3: catálogo
- [ ] Fase 4: pedidos (+ revisiones ECC) — **frena para mostrar resultado**
- [ ] Fase 5: frontend base y cliente
- [ ] Fase 6: panel de administración
- [ ] Fase 7: integración y calidad — **frena para pasar a PostgreSQL**
- [ ] Fase 8: entrega (README, guion de video, zip)

Detalle de tareas y trazabilidad con la rúbrica: [docs/PLAN_IMPLEMENTACION.md](docs/PLAN_IMPLEMENTACION.md).

## Cómo retomar en otra sesión

1. Leer este archivo y la tabla de estado de arriba.
2. Abrir `docs/PLAN_IMPLEMENTACION.md` y buscar la primera tarea sin tildar de la fase en curso.
3. Leer solo el documento que corresponda (tabla "Qué leer").
4. `git log --oneline` para ver el último commit de fase y `git status` para ver trabajo sin commitear.
5. Cerrar cada fase igual: verificar con evidencia → actualizar el estado de este archivo → commit local → resumen de 3 a 5 líneas en lenguaje simple.
6. Responder en español rioplatense.

## Convenciones

- Código, comentarios breves, mensajes de la API y de la UI: español rioplatense (vos). Identificadores con los nombres exactos de la consigna.
- Mensajes de error de la API siempre como `{"detail": ...}` (texto en 400/401/403/404/409; lista en 422).
- Fechas: se guardan en UTC sin zona; los schemas de lectura las devuelven como UTC explícito con `Z` (`UserPublic.created_at`, `PedidoRead.created_at/updated_at`). `pedidos_hoy` desde la medianoche de Argentina (UTC-3). Ver TRD §8.

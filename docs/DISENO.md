# DISEÑO — Food Store (frontend)

Pantallas, rutas, componentes y comportamiento de la interfaz. Reglas técnicas en [TRD.md](TRD.md) §9. Toda la UI va **en español rioplatense**, simple, consistente y usable en celular (mobile-first con Tailwind).

## 1. Rutas

| Ruta | Pantalla | Acceso | Qué hace |
|---|---|---|---|
| `/login` | LoginPage | Público | Login con `username` y `password` (TanStack Form). |
| `/register` | RegisterPage | Público | Registro con validación (TanStack Form). |
| `/` | CatalogoPage | Público | Catálogo paginado en el servidor, búsqueda, filtro por categoría, skeleton, estado vacío, "Agregar al carrito". |
| `/carrito` | CarritoPage | Público | Ítems, cantidades, subtotal y total; persiste al recargar. |
| `/checkout` | CheckoutPage | Sesión | `direccion_entrega`, `forma_pago`, `notas`; `POST /pedidos`; vacía el carrito y redirige a "Mis pedidos". |
| `/mis-pedidos` | MisPedidosPage | Sesión | Pedidos propios con detalle; botón "Cancelar" solo en `PENDIENTE`. |
| `/admin/resumen` | AdminResumenPage | admin | Tarjetas con los indicadores de `ResumenPedidos`. |
| `/admin/categorias` | AdminCategoriasPage | admin | ABM con TanStack Table + Form. |
| `/admin/productos` | AdminProductosPage | admin | ABM con TanStack Table + Form; cambio de stock y disponibilidad. |
| `/admin/pedidos` | AdminPedidosPage | admin | Tabla con filtro por estado; botones para avanzar o cancelar según la máquina de estados. |
| `/admin/usuarios` | AdminUsuariosPage | admin | Tabla con `username`, nombre, email, rol y estado; Activar / Desactivar (sin Desactivar en la fila propia). |
| `/unauthorized` | UnauthorizedPage | Público | Mensaje y enlace al inicio. |
| `*` | — | — | Redirige a `/`. |

`ProtectedRoute` (con `roles` opcional): sin sesión → `/login` (recordando la ruta de origen para volver tras el login); con sesión pero sin el rol → `/unauthorized`; mientras `cargando` → indicador. La protección real está en el backend: ocultar un botón no reemplaza a `require_role`.

## 2. Estructura de carpetas

```
frontend/src/
├─ shared/
│  ├─ api/         axiosInstance.ts · handleApiError.ts · queryClient.ts
│  ├─ ui/          Button · Card · Input · Modal · BadgeEstado
│  ├─ components/  Paginacion · Skeleton · EstadoVacio · EstadoError
│  └─ layout/      Navbar · MainLayout
├─ features/
│  ├─ auth/        pages (LoginPage, RegisterPage, UnauthorizedPage) · api · types
│  ├─ categorias/  pages (AdminCategoriasPage) · components · hooks (useCategorias…) · api · types
│  ├─ productos/   pages (CatalogoPage, AdminProductosPage) · components (ProductoCard…) · hooks (useProductos…) · api · types
│  ├─ usuarios/    pages (AdminUsuariosPage) · hooks (useUsuarios…) · api · types
│  └─ pedidos/     pages (CarritoPage, CheckoutPage, MisPedidosPage, AdminPedidosPage, AdminResumenPage)
│                  components · hooks (usePedidos, useCrearPedido, useCambiarEstadoPedido, useCancelarPedido, useResumenPedidos)
│                  api (pedidos.ts) · types (Pedido, DetallePedido, EstadoPedido, ResumenPedidos)
├─ store/          authStore.ts · cartStore.ts
├─ routes/         AppRouter.tsx · ProtectedRoute.tsx
├─ App.tsx · main.tsx · index.css (@import "tailwindcss")
```

Cada feature agrupa páginas, componentes, hooks (`useQuery`/`useMutation` con `queryKey` descriptivas e invalidación), `api/` (funciones que llaman a la instancia de Axios y devuelven datos tipados) y `types/` (mismos nombres de campo que los schemas del backend). Lo transversal vive en `shared/`.

## 3. Navbar y vista por rol

| Estado | Enlaces |
|---|---|
| Visitante | Catálogo · Carrito (con contador) · Ingresar · Registrarse |
| `user` | Catálogo · Carrito · Mis pedidos · nombre y rol · Cerrar sesión |
| `admin` | lo del `user` + **Panel** (Resumen, Categorías, Productos, Pedidos, Usuarios) |

En celular, la barra se colapsa en un menú tipo hamburguesa. El panel muestra su propia navegación secundaria (pestañas) arriba del contenido.

## 4. Pantallas clave

**Catálogo (`/`)**
- Barra con búsqueda (campo de texto; se aplica al enviar con Enter o el botón "Buscar", sin `useEffect`) y selector de categoría (opciones de `GET /categorias`). Al cambiar un filtro se vuelve a la página 1.
- Grilla de `ProductoCard` (1 columna en celular, 2 en tablet, 3–4 en escritorio): imagen, nombre, categoría, precio, y badges "Sin stock" / "No disponible".
- Botón "Agregar al carrito" **deshabilitado** si `stock = 0` o `disponible = false`.
- Imagen rota → se reemplaza por un bloque visual (ícono + fondo) con `onError`.
- Cargando: `Skeleton` con la misma forma de las tarjetas. Sin resultados: `EstadoVacio`. Error: `EstadoError` con "Reintentar".
- Paginación en el servidor: `skip = página × limit` (límite 12), componente `Paginacion` (anterior / siguiente / "página X de Y").

**Carrito (`/carrito`)**: lista con imagen opcional, nombre, precio unitario, control de cantidad (− / n / +), quitar, subtotal por línea, total y botones "Vaciar" y "Confirmar pedido". Vacío: `EstadoVacio` con enlace al catálogo. Sin sesión, "Confirmar pedido" lleva a `/login`.

**Checkout (`/checkout`)**: resumen del carrito (solo lectura) + TanStack Form: `direccion_entrega` (5–200), `forma_pago` (radio: Efectivo / Transferencia), `notas` (opcional). Errores del servidor (stock insuficiente, producto no disponible…) se muestran en un `Alert` con `handleApiError`. Éxito: carrito vacío + `/mis-pedidos`.

**Mis pedidos (`/mis-pedidos`)**: tarjetas o tabla con `#id`, fecha, `BadgeEstado`, total; al abrir una se ve el detalle (líneas con nombre y precio copiados, dirección, forma de pago, notas). "Cancelar" solo si `PENDIENTE`, con confirmación en `Modal`. Filtra por `usuario_id === usuario.id` (así el admin ve solo los suyos).

**Panel — Resumen**: 6 tarjetas (`Card`): Pendientes, En preparación, Entregados, Cancelados, Pedidos de hoy, Ingresos (entregados) en `$`.

**Panel — Categorías / Productos**: tabla (TanStack Table, paginación del cliente, 10 filas por página) con columnas y botones "Editar" / "Eliminar". "Nueva categoría" y "Nuevo producto" abren un `Modal` con TanStack Form (crear y editar comparten formulario). En Productos, una columna de stock/disponibilidad con acción "Stock" que abre un modal chico (`PATCH /productos/{id}/stock`). Eliminar pide confirmación y hace baja lógica. Errores 409 (nombre duplicado) se muestran en el formulario.

**Panel — Pedidos**: tabla de **todos** los pedidos con filtro por estado (select) y botones de acción según el estado: `PENDIENTE` → "Preparar" / "Cancelar"; `EN_PREPARACION` → "Entregar" / "Cancelar"; terminales → sin botones. Cancelar pide confirmación.

**Panel — Usuarios**: tabla con `username`, nombre, email, rol y estado (Activo / Desactivado); botón "Activar" en desactivados, "Desactivar" en activos, **omitido en la fila del usuario de la sesión**.

## 5. Componentes compartidos

| Componente | Uso |
|---|---|
| `Button` | Variantes `primary`, `secondary`, `danger`; estado `cargando`/`disabled`. |
| `Card` | Contenedor con borde y sombra suave. |
| `Input` | Campo con etiqueta y mensaje de error (para TanStack Form). |
| `Modal` | Diálogo accesible (cierra con Esc y clic afuera). |
| `BadgeEstado` | Colorea los cuatro estados: `PENDIENTE` ámbar, `EN_PREPARACION` azul, `ENTREGADO` verde, `CANCELADO` rojo/gris. |
| `Paginacion` | Anterior / siguiente / página actual. |
| `Skeleton` | Bloques animados de carga. |
| `EstadoVacio`, `EstadoError` | Estados reutilizados en todas las listas. |
| `Navbar`, `MainLayout` | Navegación según rol y contenido de la ruta. |

## 6. Estilo

- Tailwind 4 vía `@tailwindcss/vite`; `index.css` solo con `@import "tailwindcss";`.
- Paleta sobria: neutros (slate/zinc) + un acento cálido (naranja/ámbar) para la acción principal; `BadgeEstado` y botones de peligro usan colores semánticos. Contraste AA en texto.
- Tipografía del sistema; tamaños base legibles (16 px); botones y campos con área táctil ≥ 40 px.
- Formato de moneda con `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`; fechas con `Intl.DateTimeFormat("es-AR")` tras el ajuste UTC del helper.
- Sin librerías de UI ni de íconos extra: íconos con SVG inline o emoji.

## 7. Estados y mensajes (todas las listas)

| Situación | Muestra |
|---|---|
| Cargando | `Skeleton` |
| Sin datos | `EstadoVacio` con mensaje y acción sugerida |
| Error de red / servidor | `EstadoError` con `handleApiError` y "Reintentar" (`refetch`) |
| Mutación en curso | Botón con `cargando`, deshabilitado |
| Mutación OK | Modal se cierra y la lista se refresca por invalidación |
| Mutación con error | `Alert` con el `detail` (texto o lista 422) |

## 8. Accesibilidad básica

Etiquetas asociadas a cada campo, `aria-live` en mensajes de error, foco visible, botones con texto (no solo ícono), imágenes con `alt`, tablas con `<th scope>`.

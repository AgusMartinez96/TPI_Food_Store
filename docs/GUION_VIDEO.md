# Guion del video de demostración (CE-07)

**Duración objetivo: 13 minutos** (la consigna pide entre 10 y 15). El link público del video se pega en el `README.md` de la raíz.

Lo que debe aparecer, según CE-07: **(1) presentación con la cámara encendida al inicio, (2) registro, (3) compra como cliente, (4) gestión como admin y (5) cancelación con restitución de stock.**

## Antes de grabar (10 minutos de preparación)

1. **Base limpia con el seed**: borrá `foodstore.db` (o usá una base nueva) y corré `python -m app.db.seed`. Así el stock inicial es el conocido: *Hamburguesa clásica 25*, *Agua mineral 80*, *Flan casero 12*.
2. Dos terminales: `uvicorn app.main:app --reload` (backend) y `pnpm dev` (frontend). Comprobá `http://localhost:8000/docs` y `http://localhost:5173`.
3. **Dos ventanas del navegador** (una normal y una de incógnito) para tener a la vez la sesión de un cliente y la del admin. Siempre `localhost`, nunca `127.0.0.1`.
4. Abrí las DevTools (F12) en la pestaña *Application → Cookies* para mostrar la cookie.
5. Cámara y micrófono probados; resolución de pantalla legible (zoom del navegador al 110 %). Cerrá notificaciones.
6. Tené el cliente de prueba pensado: usuario `cliente1`, nombre "Cliente Prueba", email `cliente@mail.com`, contraseña `clave1234`.

## Guion con tiempos

| Tiempo | Qué mostrar | Qué decir |
|---|---|---|
| **0:00 – 1:30** | **Cámara encendida**, vos hablando. Después la pantalla compartida con el repositorio abierto. | Nombre, materia (Programación 4, UTN), qué es Food Store y para quién (clientes que piden comida y un administrador que gestiona el negocio). Stack: FastAPI + SQLModel + PostgreSQL en el backend; React, TypeScript, TanStack Query/Form/Table, Zustand y Axios en el frontend. Qué vas a mostrar en el video. |
| **1:30 – 3:00** | `http://localhost:8000/docs`: recorrer los grupos *Auth*, *Categorías*, *Productos*, *Pedidos*, *Usuarios (admin)*. Abrir el código: `core/unit_of_work.py` y un `service.py` (`pedidos`). | La API documentada en `/docs`. Arquitectura en capas: Router → Service → Unit of Work → Repository → Model. **El commit ocurre solo en `UnitOfWork.__exit__`**; los Services abren `with self.uow as uow:`. Sesión con JWT en cookie HttpOnly. El seed con `python -m app.db.seed`. |
| **3:00 – 4:30** | **Registro** (ventana de cliente): `Registrarse`, mostrar la validación de campos vacíos, el registro de `cliente1`. Mostrar en DevTools la cookie `access_token` marcada **HttpOnly**; en la consola, `document.cookie` vacío. | El registro público crea siempre rol `user`. El frontend nunca lee ni guarda el token: viaja en una cookie HttpOnly. En el almacenamiento solo está el usuario. |
| **4:30 – 6:00** | **Catálogo**: skeleton al cargar, buscar `HAMBURGUESA` (en mayúsculas), filtrar por categoría, paginación. Agregar al carrito: 2 × Hamburguesa clásica y 1 × Agua mineral. **Recargar la página** y mostrar que el carrito sigue. | Paginación en el servidor, búsqueda sin distinguir mayúsculas, estado vacío. El botón "Agregar al carrito" se deshabilita sin stock. El carrito persiste en el navegador con Zustand. |
| **6:00 – 8:00** | **Compra como cliente**: Carrito → *Confirmar pedido* → checkout. Probar una dirección de 3 caracteres (error), después `Av. Siempre Viva 742`, forma de pago *Transferencia*, notas. Confirmar. Ir a **Mis pedidos**, abrir el detalle. | Formulario con TanStack Form y validaciones (dirección de 5 a 200). Al confirmar: un solo `POST /pedidos`, el carrito se vacía y se va a "Mis pedidos". El detalle muestra nombre y precio **copiados** del producto en el momento de la compra. |
| **8:00 – 10:30** | **Gestión como admin** (ventana de incógnito, `admin` / `Admin1234!`): *Resumen* (tarjetas), *Categorías* (crear "Ensaladas", probar el nombre repetido → 409, editar, eliminar), *Productos* (crear uno con imagen vacía, cambiar **stock y disponibilidad**, ver cómo el catálogo del cliente muestra "Sin stock"), *Pedidos* (filtrar por estado, **Preparar** el pedido), *Usuarios* (desactivar a otro usuario; mostrar que en la fila propia no hay botón Desactivar). | Panel con TanStack Table (paginación del cliente) y TanStack Form. Las bajas son lógicas. Un admin no puede desactivarse a sí mismo. Rutas protegidas por rol: un cliente que abre `/admin/...` termina en `/unauthorized`, y el backend lo reafirma con `require_role` (403). |
| **10:30 – 12:30** | **Cancelación con restitución de stock** (la parte central). 1) En el panel de admin → *Productos*, anotar el stock de la clásica (23). 2) Cliente: crear otro pedido de 2 clásicas (stock 21). 3) Cliente: **Mis pedidos → Cancelar** (modal de confirmación). 4) Admin: recargar *Productos* y mostrar que el stock **volvió a 23**. 5) En `/docs`, con la sesión del admin, mostrar que `PATCH /pedidos/{id}/cancelar` sobre un pedido **ajeno** responde **403**, y que el admin sí cancela con `PATCH /pedidos/{id}/estado`. | Cancelar restituye el stock **en la misma transacción** que cambia el estado. Solo el dueño usa `/cancelar` (y solo desde `PENDIENTE`); el admin cancela con `/estado`. La máquina de estados: `PENDIENTE → EN_PREPARACION → ENTREGADO`, y `CANCELADO` desde los dos primeros. |
| **12:30 – 13:30** | `/docs` → `POST /pedidos` con **dos ítems donde el segundo no tiene stock suficiente**: responde 400. Volver al panel y mostrar que el stock del primer ítem **no cambió**. | Todo ocurre en una sola transacción: si falla un ítem, el Unit of Work hace rollback y no se persiste nada, tampoco el descuento del primero. Verificado también sobre PostgreSQL. |
| **13:30 – 14:00** | Código: `tsconfig.app.json` (`strict: true`) y una búsqueda de `any` sin resultados; `package.json` con versiones fijadas. | Calidad: TypeScript estricto sin `any`, dependencias con versión exacta, `.env.example` en backend y frontend, README con los pasos. |
| **14:00 – 14:30** | Cierre, otra vez a cámara si querés. | Resumen de lo mostrado y agradecimiento. |

> Si te pasás del tiempo, recortá el tramo de `/docs` (1:30 – 3:00) y la parte de calidad (13:30 – 14:00). **No recortes** el registro, la compra, la gestión de admin ni la cancelación con restitución: son lo que pide CE-07.

## Datos de apoyo para no improvisar

- **Admin del seed:** `admin` / `Admin1234!`.
- **Stock inicial del seed:** Hamburguesa clásica 25 · Hamburguesa doble 20 · Hamburguesa vegetariana 15 · Pizza muzzarella 30 · Pizza napolitana 18 · Gaseosa cola 60 · Agua mineral 80 · Flan casero 12 · Brownie con helado 10.
- **Pedido de ejemplo:** 2 × Hamburguesa clásica ($ 8.500 c/u) + 1 × Agua mineral ($ 1.500) = **$ 18.500**. Tras crearlo, el stock queda en clásica 23 y agua 79; al cancelarlo, vuelve a 25 y 80.
- **Códigos que conviene mencionar:** 409 (nombre duplicado o usuario repetido), 401 (credenciales o sesión), 400 "Cuenta de usuario desactivada", 403 (rol o pedido ajeno), 404, 422 (validación) y 400 (stock insuficiente / transición inválida).

## Checklist final antes de subir el video

- [ ] Se ve y se escucha bien; la **cámara está encendida al inicio**.
- [ ] Dura entre **10 y 15 minutos**.
- [ ] Aparecen: registro, compra como cliente, gestión como admin y cancelación con restitución de stock.
- [ ] El video es **público** (o "no listado" con link accesible) y el link está pegado en el `README.md`.
- [ ] No se ve ninguna contraseña real, ni el archivo `.env`.

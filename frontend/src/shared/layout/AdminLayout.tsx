import { NavLink, Outlet } from 'react-router-dom'

const SECCIONES = [
  { ruta: '/admin/resumen', texto: 'Resumen' },
  { ruta: '/admin/categorias', texto: 'Categorías' },
  { ruta: '/admin/productos', texto: 'Productos' },
  { ruta: '/admin/pedidos', texto: 'Pedidos' },
  { ruta: '/admin/usuarios', texto: 'Usuarios' },
] as const

/** Navegación secundaria (pestañas) del panel de administración. */
export function AdminLayout() {
  return (
    <div>
      <nav aria-label="Panel de administración" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-stone-200 px-1 pb-2">
        {SECCIONES.map((s) => (
          <NavLink
            key={s.ruta}
            to={s.ruta}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-200'}`
            }
          >
            {s.texto}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

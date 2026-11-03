import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Rol } from '../features/auth/types/auth'

interface ProtectedRouteProps {
  /** Roles permitidos. Sin roles, alcanza con tener sesión. */
  roles?: Rol[]
}

/**
 * Sin sesión redirige a /login (recordando la ruta de origen); sin el rol, a /unauthorized.
 * La protección real está en el backend (require_role): ocultar una pantalla no reemplaza al 403.
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  // checkSession todavía está confirmando la sesión con el backend
  if (cargando) {
    return (
      <p role="status" className="py-16 text-center text-stone-500">
        Verificando sesión…
      </p>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}

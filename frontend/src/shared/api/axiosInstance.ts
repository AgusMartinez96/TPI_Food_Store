import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

// Instancia única: TODAS las peticiones del frontend pasan por acá.
// withCredentials hace que el navegador adjunte la cookie HttpOnly de sesión (otro origen: localhost:8000).
// El frontend nunca lee ni guarda el token.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
})

const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response
      const url = error.config?.url ?? ''
      const detail: unknown = typeof data === 'object' && data !== null ? (data as { detail?: unknown }).detail : undefined
      // 401 fuera de /auth/token y /auth/me: la sesión venció. /auth/token (credenciales incorrectas)
      // y /auth/me (chequeo al abrir la app) manejan su propio 401.
      const sesionVencida = status === 401 && url !== '/auth/token' && url !== '/auth/me'
      const cuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA
      if (sesionVencida || cuentaDesactivada) {
        // ProtectedRoute redirige a /login al quedar sin usuario
        useAuthStore.getState().limpiarSesion()
      }
    }
    return Promise.reject(error)
  },
)

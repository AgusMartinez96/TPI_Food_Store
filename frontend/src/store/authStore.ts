import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getMe, login as loginRequest, logout as logoutRequest } from '../features/auth/api/auth'
import type { Usuario } from '../features/auth/types/auth'
import { queryClient } from '../shared/api/queryClient'

interface AuthState {
  usuario: Usuario | null
  /** true mientras checkSession confirma la sesión con el backend; arranca en true */
  cargando: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  /** La usa el interceptor de Axios ante un 401 o una cuenta desactivada */
  limpiarSesion: () => void
}

// La sesión real vive en la cookie HttpOnly: acá solo se guarda el usuario (nunca el token).
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await loginRequest({ username, password }) // deja la cookie; el cuerpo no trae el token
        const usuario = await getMe()
        set({ usuario })
      },

      logout: async () => {
        try {
          await logoutRequest()
        } catch {
          // aunque el backend no responda, la sesión local se cierra igual
        } finally {
          get().limpiarSesion()
        }
      },

      checkSession: async () => {
        try {
          set({ usuario: await getMe() })
        } catch (error) {
          // 401 (sin sesión) o 400 (cuenta desactivada): no hay sesión válida.
          // Un error de red no la cierra: el backend puede estar levantándose.
          if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
            get().limpiarSesion()
          }
        } finally {
          set({ cargando: false })
        }
      },

      limpiarSesion: () => {
        set({ usuario: null })
        // Se descartan solo los datos propios del usuario anterior. NO se usa queryClient.clear(): también
        // borraría las consultas públicas (catálogo) que estén en vuelo y la pantalla quedaría cargando.
        queryClient.removeQueries({ queryKey: ['pedidos'] })
        queryClient.removeQueries({ queryKey: ['usuarios'] })
      },
    }),
    {
      name: 'food-store-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

import { QueryClient } from '@tanstack/react-query'

// Instancia única de TanStack Query. Vive en su propio módulo para que authStore pueda
// vaciar la caché al cerrar sesión sin importar main.tsx (evita un ciclo de imports).
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

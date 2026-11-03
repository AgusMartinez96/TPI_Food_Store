import { useEffect } from 'react'
import { AppRouter } from './routes/AppRouter'
import { useAuthStore } from './store/authStore'

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)

  // Único useEffect de datos de toda la app: confirma con GET /auth/me si la cookie sigue válida
  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return <AppRouter />
}

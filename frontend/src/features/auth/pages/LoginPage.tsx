import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'

/** ProtectedRoute manda la ruta de origen en location.state.from para volver tras el login. */
function destinoDesde(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = (state as { from: unknown }).from
    if (typeof from === 'object' && from !== null && 'pathname' in from) {
      const ruta = (from as { pathname: unknown }).pathname
      if (typeof ruta === 'string') return ruta
    }
  }
  return '/'
}

export function LoginPage() {
  const location = useLocation()
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState<string | null>(null)
  const destino = destinoDesde(location.state)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await login(value.username.trim(), value.password)
      } catch (e) {
        setError(handleApiError(e))
      }
    },
  })

  // Al guardarse el usuario en authStore se redirige solo
  if (usuario) return <Navigate to={destino} replace />

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-xl font-bold">Ingresar</h1>
        <p className="mt-1 text-sm text-stone-600">Entrá con tu usuario para hacer pedidos.</p>
        <form
          className="mt-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
          >
            {(field) => (
              <Input
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          {error && <Alert>{error}</Alert>}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(enviando) => (
              <Button type="submit" cargando={enviando} className="mt-3 w-full">
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-orange-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}

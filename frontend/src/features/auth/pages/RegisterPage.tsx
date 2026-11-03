import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'
import { register } from '../api/auth'
import type { UserCreate } from '../types/auth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_BYTES_PASSWORD = 72 // límite de bcrypt, medido en bytes (no en caracteres)

export function RegisterPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)

  // Registra y entra directo con la cuenta nueva
  const registrar = useMutation({
    mutationFn: async (datos: UserCreate) => {
      await register(datos)
      await login(datos.username, datos.password)
    },
  })

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '' },
    onSubmit: ({ value }) => {
      registrar.mutate({ ...value, username: value.username.trim(), full_name: value.full_name.trim(), email: value.email.trim() })
    },
  })

  if (usuario) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="text-xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-stone-600">Registrate para hacer tus pedidos.</p>
        <form
          className="mt-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="username" validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Elegí un nombre de usuario') }}>
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
          <form.Field name="full_name" validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu nombre completo') }}>
            {(field) => (
              <Input
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          <form.Field name="email" validators={{ onChange: ({ value }) => (EMAIL.test(value.trim()) ? undefined : 'Ingresá un email válido') }}>
            {(field) => (
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
                if (new TextEncoder().encode(value).length > MAX_BYTES_PASSWORD) {
                  return `La contraseña no puede superar los ${MAX_BYTES_PASSWORD} bytes (los acentos y símbolos ocupan más de 1)`
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          {registrar.isError && <Alert>{handleApiError(registrar.error)}</Alert>}
          <Button type="submit" cargando={registrar.isPending} className="mt-3 w-full">
            Registrarme
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-orange-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  )
}

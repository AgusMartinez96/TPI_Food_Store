import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearFecha } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import type { Usuario } from '../../auth/types/auth'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'

export function AdminUsuariosPage() {
  const yo = useAuthStore((s) => s.usuario)
  const { data, isPending, isError, error, refetch } = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const ocupado = activar.isPending || desactivar.isPending

  // Se limpian los dos errores antes de cada acción: el aviso siempre es del último intento
  function ejecutar(accion: 'activar' | 'desactivar', id: number) {
    activar.reset()
    desactivar.reset()
    if (accion === 'activar') activar.mutate(id)
    else desactivar.mutate(id)
  }

  const columnas = useMemo<ColumnDef<Usuario>[]>(
    () => [
      { id: 'username', header: 'Usuario', cell: ({ row }) => <span className="font-medium">{row.original.username}</span> },
      { id: 'full_name', header: 'Nombre', cell: ({ row }) => row.original.full_name },
      { id: 'email', header: 'Email', cell: ({ row }) => row.original.email },
      {
        id: 'role',
        header: 'Rol',
        cell: ({ row }) => (row.original.role === 'admin' ? 'Administrador' : 'Cliente'),
      },
      { id: 'created_at', header: 'Alta', cell: ({ row }) => formatearFecha(row.original.created_at) },
      {
        id: 'estado',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Desactivado</span>
          ) : (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Activo</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const u = row.original
          if (u.disabled) {
            return (
              <Button variante="secondary" disabled={ocupado} onClick={() => ejecutar('activar', u.id)}>
                Activar
              </Button>
            )
          }
          // Un admin no puede desactivarse a sí mismo: en su propia fila no hay botón Desactivar
          if (u.id === yo?.id) return <span className="text-xs text-stone-500">Es tu cuenta</span>
          return (
            <Button variante="danger" disabled={ocupado} onClick={() => ejecutar('desactivar', u.id)}>
              Desactivar
            </Button>
          )
        },
      },
    ],
    // ejecutar solo usa mutate/reset de las mutaciones, que son estables; lo que cambia es `ocupado` y quién es `yo`
    [yo?.id, ocupado],
  )

  return (
    <div>
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <p className="mt-1 text-sm text-stone-600">Activá o desactivá cuentas. Un usuario desactivado no puede iniciar sesión.</p>
      <div className="mt-4 space-y-3">
        {(activar.isError || desactivar.isError) && <Alert>{handleApiError(activar.error ?? desactivar.error)}</Alert>}
        {isPending ? (
          <SkeletonFilas />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : data.length === 0 ? (
          <EstadoVacio titulo="No hay usuarios" />
        ) : (
          <DataTable datos={data} columnas={columnas} />
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import type { DatosCategoria } from '../components/CategoriaForm'
import { useActualizarCategoria, useCategorias, useCrearCategoria, useEliminarCategoria } from '../hooks/useCategorias'
import type { Categoria } from '../types/categoria'

export function AdminCategoriasPage() {
  const [formulario, setFormulario] = useState<Categoria | 'nueva' | null>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)

  const { data, isPending, isError, error, refetch } = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

  const mutacionForm = formulario === 'nueva' ? crear : actualizar

  function abrir(destino: Categoria | 'nueva') {
    crear.reset()
    actualizar.reset()
    setFormulario(destino)
  }

  function guardar(datos: DatosCategoria) {
    const cuerpo = { nombre: datos.nombre, descripcion: datos.descripcion || null }
    if (formulario === 'nueva') {
      crear.mutate(cuerpo, { onSuccess: () => setFormulario(null) })
    } else if (formulario) {
      actualizar.mutate({ id: formulario.id, datos: cuerpo }, { onSuccess: () => setFormulario(null) })
    }
  }

  function confirmarBaja() {
    if (aEliminar) eliminar.mutate(aEliminar.id, { onSuccess: () => setAEliminar(null) })
  }

  function cerrarBaja() {
    setAEliminar(null)
    eliminar.reset()
  }

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { id: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      {
        id: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => row.original.descripcion ?? <span className="text-stone-400">—</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variante="secondary" onClick={() => abrir(row.original)}>
              Editar
            </Button>
            <Button variante="danger" onClick={() => setAEliminar(row.original)}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    // las columnas solo llaman a setters de estado y a reset de mutaciones, que son estables
    [],
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="mt-1 text-sm text-stone-600">Eliminar una categoría la da de baja: no borra sus productos ni libera su nombre.</p>
        </div>
        <Button onClick={() => abrir('nueva')}>Nueva categoría</Button>
      </div>

      <div className="mt-4">
        {isPending ? (
          <SkeletonFilas />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : data.length === 0 ? (
          <EstadoVacio titulo="No hay categorías" accion={<Button onClick={() => abrir('nueva')}>Crear la primera</Button>} />
        ) : (
          <DataTable datos={data} columnas={columnas} />
        )}
      </div>

      <Modal abierto={formulario !== null} titulo={formulario === 'nueva' ? 'Nueva categoría' : 'Editar categoría'} onCerrar={() => setFormulario(null)}>
        {formulario !== null && (
          <CategoriaForm
            inicial={formulario === 'nueva' ? undefined : formulario}
            onEnviar={guardar}
            onCancelar={() => setFormulario(null)}
            enviando={mutacionForm.isPending}
            error={mutacionForm.isError ? handleApiError(mutacionForm.error) : null}
          />
        )}
      </Modal>

      <Modal abierto={aEliminar !== null} titulo="Eliminar categoría" onCerrar={cerrarBaja}>
        <p className="text-sm text-stone-700">
          ¿Dar de baja la categoría «{aEliminar?.nombre}»? Dejará de verse en el catálogo, pero sus productos y su nombre se conservan.
        </p>
        {eliminar.isError && (
          <div className="mt-3">
            <Alert>{handleApiError(eliminar.error)}</Alert>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variante="secondary" onClick={cerrarBaja}>
            Volver
          </Button>
          <Button variante="danger" cargando={eliminar.isPending} onClick={confirmarBaja}>
            Sí, eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

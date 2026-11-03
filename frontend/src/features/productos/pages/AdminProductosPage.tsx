import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { handleApiError } from '../../../shared/api/handleApiError'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearMoneda } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

export function AdminProductosPage() {
  const [formulario, setFormulario] = useState<Producto | 'nuevo' | null>(null)
  const [stockDe, setStockDe] = useState<Producto | null>(null)
  const [aEliminar, setAEliminar] = useState<Producto | null>(null)

  // El panel pide hasta 100 productos y pagina del lado del cliente
  const { data, isPending, isError, error, refetch } = useProductos({ skip: 0, limit: 100 })
  const { data: categorias } = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const cambiarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const mutacionForm = formulario === 'nuevo' ? crear : actualizar

  function abrirFormulario(destino: Producto | 'nuevo') {
    crear.reset()
    actualizar.reset()
    setFormulario(destino)
  }

  function abrirStock(producto: Producto) {
    cambiarStock.reset()
    setStockDe(producto)
  }

  function guardar(datos: ProductoCreate) {
    if (formulario === 'nuevo') {
      crear.mutate(datos, { onSuccess: () => setFormulario(null) })
    } else if (formulario) {
      actualizar.mutate({ id: formulario.id, datos }, { onSuccess: () => setFormulario(null) })
    }
  }

  function guardarStock(datos: Required<ProductoStockUpdate>) {
    if (stockDe) cambiarStock.mutate({ id: stockDe.id, datos }, { onSuccess: () => setStockDe(null) })
  }

  function confirmarBaja() {
    if (aEliminar) eliminar.mutate(aEliminar.id, { onSuccess: () => setAEliminar(null) })
  }

  function cerrarBaja() {
    setAEliminar(null)
    eliminar.reset()
  }

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: 'nombre',
        header: 'Producto',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.nombre}</p>
            {row.original.descripcion && <p className="line-clamp-1 max-w-64 text-xs text-stone-500">{row.original.descripcion}</p>}
          </div>
        ),
      },
      {
        id: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => (
          <span>
            {row.original.categoria.nombre}
            {!row.original.categoria.activo && <span className="ml-1 text-xs text-red-700">(dada de baja)</span>}
          </span>
        ),
      },
      { id: 'precio_base', header: 'Precio', cell: ({ row }) => formatearMoneda(row.original.precio_base) },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? 'font-semibold text-red-700' : ''}>{row.original.stock}</span>
        ),
      },
      {
        id: 'disponible',
        header: 'Disponible',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${row.original.disponible ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'}`}
          >
            {row.original.disponible ? 'Sí' : 'No'}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button variante="secondary" onClick={() => abrirFormulario(row.original)}>
              Editar
            </Button>
            <Button variante="secondary" onClick={() => abrirStock(row.original)}>
              Stock
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
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="mt-1 text-sm text-stone-600">Alta, edición, stock y disponibilidad. Eliminar es una baja lógica.</p>
        </div>
        <Button onClick={() => abrirFormulario('nuevo')}>Nuevo producto</Button>
      </div>

      <div className="mt-4">
        {isPending ? (
          <SkeletonFilas />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : data.items.length === 0 ? (
          <EstadoVacio titulo="No hay productos" accion={<Button onClick={() => abrirFormulario('nuevo')}>Crear el primero</Button>} />
        ) : (
          <DataTable datos={data.items} columnas={columnas} />
        )}
      </div>

      <Modal abierto={formulario !== null} titulo={formulario === 'nuevo' ? 'Nuevo producto' : 'Editar producto'} onCerrar={() => setFormulario(null)}>
        {formulario !== null && (
          <ProductoForm
            inicial={formulario === 'nuevo' ? undefined : formulario}
            categorias={categorias ?? []}
            onEnviar={guardar}
            onCancelar={() => setFormulario(null)}
            enviando={mutacionForm.isPending}
            error={mutacionForm.isError ? handleApiError(mutacionForm.error) : null}
          />
        )}
      </Modal>

      <Modal abierto={stockDe !== null} titulo={`Stock de ${stockDe?.nombre ?? ''}`} onCerrar={() => setStockDe(null)}>
        {stockDe && (
          <StockForm
            producto={stockDe}
            onEnviar={guardarStock}
            onCancelar={() => setStockDe(null)}
            enviando={cambiarStock.isPending}
            error={cambiarStock.isError ? handleApiError(cambiarStock.error) : null}
          />
        )}
      </Modal>

      <Modal abierto={aEliminar !== null} titulo="Eliminar producto" onCerrar={cerrarBaja}>
        <p className="text-sm text-stone-700">
          ¿Dar de baja «{aEliminar?.nombre}»? Dejará de verse en el catálogo. Los pedidos ya hechos conservan sus datos.
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

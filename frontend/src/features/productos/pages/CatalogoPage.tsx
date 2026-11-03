import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonTarjetas } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input, Select } from '../../../shared/ui/Input'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const LIMITE = 12

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0)
  const [entrada, setEntrada] = useState('') // lo que se está escribiendo
  const [search, setSearch] = useState('') // la búsqueda aplicada
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)

  const { data: categorias } = useCategorias()
  const { data, isPending, isError, error, refetch } = useProductos({
    skip: pagina * LIMITE, // paginación en el servidor
    limit: LIMITE,
    search: search || undefined,
    categoria_id: categoriaId,
  })

  function buscar(e: FormEvent) {
    e.preventDefault()
    setSearch(entrada.trim())
    setPagina(0)
  }

  function limpiar() {
    setEntrada('')
    setSearch('')
    setCategoriaId(undefined)
    setPagina(0)
  }

  const totalPaginas = data ? Math.ceil(data.total / LIMITE) : 0
  const hayFiltros = search !== '' || categoriaId !== undefined

  return (
    <div>
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <p className="mt-1 text-sm text-stone-600">Elegí lo que quieras y armá tu pedido.</p>

      <form onSubmit={buscar} className="mt-4 grid gap-x-3 sm:grid-cols-[1fr_14rem_auto] sm:items-start">
        <Input label="Buscar por nombre" placeholder="Ej: hamburguesa" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        <Select
          label="Categoría"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value === '' ? undefined : Number(e.target.value))
            setPagina(0)
          }}
        >
          <option value="">Todas</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <div className="flex gap-2 sm:mt-6">
          <Button type="submit">Buscar</Button>
          {hayFiltros && (
            <Button variante="secondary" onClick={limpiar}>
              Limpiar
            </Button>
          )}
        </div>
      </form>

      <div className="mt-4">
        {isPending ? (
          <SkeletonTarjetas cantidad={LIMITE} />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : data.items.length === 0 ? (
          <EstadoVacio
            titulo="No encontramos productos"
            descripcion={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
            accion={hayFiltros ? <Button variante="secondary" onClick={limpiar}>Ver todo el catálogo</Button> : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((p) => (
                <ProductoCard key={p.id} producto={p} />
              ))}
            </div>
            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
          </>
        )}
      </div>
    </div>
  )
}

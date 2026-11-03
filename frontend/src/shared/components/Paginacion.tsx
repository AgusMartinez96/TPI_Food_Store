import { Button } from '../ui/Button'

interface PaginacionProps {
  /** Página actual, empezando en 0 */
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

export function Paginacion({ pagina, totalPaginas, onCambiar }: PaginacionProps) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-3">
      <Button variante="secondary" disabled={pagina <= 0} onClick={() => onCambiar(pagina - 1)}>
        ← Anterior
      </Button>
      <span className="text-sm text-stone-600">
        Página {pagina + 1} de {totalPaginas}
      </span>
      <Button variante="secondary" disabled={pagina >= totalPaginas - 1} onClick={() => onCambiar(pagina + 1)}>
        Siguiente →
      </Button>
    </nav>
  )
}

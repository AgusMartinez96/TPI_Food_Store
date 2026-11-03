/** Bloque animado de carga. El tamaño y la forma se pasan por className. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

/** Grilla de tarjetas de carga con la misma forma que el catálogo. */
export function SkeletonTarjetas({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-4 h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

/** Filas de carga para listas y tablas. */
export function SkeletonFilas({ cantidad = 5 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

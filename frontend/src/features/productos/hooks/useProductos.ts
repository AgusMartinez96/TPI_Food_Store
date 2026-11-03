import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listarProductos } from '../api/productos'
import type { FiltrosProductos } from '../types/producto'

export const PRODUCTOS_KEY = ['productos'] as const

/** queryKey descriptiva: ['productos', filtros]. Invalidar PRODUCTOS_KEY refresca todas las variantes. */
export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: [...PRODUCTOS_KEY, filtros],
    queryFn: () => listarProductos(filtros),
    placeholderData: keepPreviousData, // al cambiar de página no parpadea el catálogo
  })
}

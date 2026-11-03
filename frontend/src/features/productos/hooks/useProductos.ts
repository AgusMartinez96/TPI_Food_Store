import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarProducto, actualizarStock, crearProducto, eliminarProducto, listarProductos } from '../api/productos'
import type { FiltrosProductos, ProductoCreate, ProductoStockUpdate, ProductoUpdate } from '../types/producto'

export const PRODUCTOS_KEY = ['productos'] as const

/** queryKey descriptiva: ['productos', filtros]. Invalidar PRODUCTOS_KEY refresca todas las variantes. */
export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: [...PRODUCTOS_KEY, filtros],
    queryFn: () => listarProductos(filtros),
    placeholderData: keepPreviousData, // al cambiar de página no parpadea el catálogo
  })
}

function useInvalidarProductos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEY })
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({ mutationFn: (datos: ProductoCreate) => crearProducto(datos), onSuccess: invalidar })
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoUpdate }) => actualizarProducto(id, datos),
    onSuccess: invalidar,
  })
}

/** PATCH /productos/{id}/stock: cambia el stock y la disponibilidad. */
export function useActualizarStock() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoStockUpdate }) => actualizarStock(id, datos),
    onSuccess: invalidar,
  })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({ mutationFn: (id: number) => eliminarProducto(id), onSuccess: invalidar })
}

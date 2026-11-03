import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRODUCTOS_KEY } from '../../productos/hooks/useProductos'
import { cambiarEstado, cancelarPedido, crearPedido, listarPedidos, obtenerResumen } from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos } from '../types/pedido'

export const PEDIDOS_KEY = ['pedidos'] as const
const RESUMEN_KEY = [...PEDIDOS_KEY, 'resumen'] as const

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: [...PEDIDOS_KEY, filtros],
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: RESUMEN_KEY, queryFn: obtenerResumen })
}

/**
 * Crear, cancelar o cambiar el estado de un pedido puede cambiar el stock: se invalidan pedidos y productos.
 * Se usa con onSettled (también ante un error): un 400 por "stock insuficiente" significa que el catálogo en
 * pantalla quedó desactualizado, y hay que refrescarlo igual.
 */
function useInvalidarPedidosYProductos() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PEDIDOS_KEY }), // incluye el resumen
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEY }),
    ])
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({ mutationFn: crearPedido, onSettled: invalidar })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({ mutationFn: (id: number) => cancelarPedido(id), onSettled: invalidar })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYProductos()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSettled: invalidar,
  })
}

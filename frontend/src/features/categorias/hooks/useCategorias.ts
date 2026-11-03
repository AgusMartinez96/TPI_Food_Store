import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRODUCTOS_KEY } from '../../productos/hooks/useProductos'
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const CATEGORIAS_KEY = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: CATEGORIAS_KEY, queryFn: listarCategorias })
}

/** Los productos muestran el nombre de su categoría: al cambiarla o darla de baja también se refrescan. */
function useInvalidarCategorias() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEY }),
    ])
  }
}

export function useCrearCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({ mutationFn: (datos: CategoriaCreate) => crearCategoria(datos), onSuccess: invalidar })
}

export function useActualizarCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) => actualizarCategoria(id, datos),
    onSuccess: invalidar,
  })
}

export function useEliminarCategoria() {
  const invalidar = useInvalidarCategorias()
  return useMutation({ mutationFn: (id: number) => eliminarCategoria(id), onSuccess: invalidar })
}

import { useQuery } from '@tanstack/react-query'
import { listarCategorias } from '../api/categorias'

export const CATEGORIAS_KEY = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: CATEGORIAS_KEY, queryFn: listarCategorias })
}

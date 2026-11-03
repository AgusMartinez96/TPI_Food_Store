// Mismos nombres de campo que los schemas CategoriaRead / CategoriaCreate / CategoriaUpdate del backend
export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface CategoriaCreate {
  nombre: string
  descripcion?: string | null
}

export type CategoriaUpdate = Partial<CategoriaCreate>

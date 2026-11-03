// Mismos nombres de campo que los schemas UserPublic / UserCreate del backend
export type Rol = 'user' | 'admin'

export interface Usuario {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

export interface UserCreate {
  username: string
  full_name: string
  email: string
  password: string
}

export interface LoginCredenciales {
  username: string
  password: string
}

import { api } from '../../../shared/api/axiosInstance'
import type { LoginCredenciales, UserCreate, Usuario } from '../types/auth'

/** Login OAuth2 por formulario. La respuesta deja la cookie HttpOnly; el cuerpo no trae el token. */
export async function login(credenciales: LoginCredenciales): Promise<void> {
  const formulario = new URLSearchParams({ username: credenciales.username, password: credenciales.password })
  await api.post('/auth/token', formulario)
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me')
  return data
}

export async function register(datos: UserCreate): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/register', datos)
  return data
}

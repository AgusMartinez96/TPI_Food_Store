import axios from 'axios'

// Mensajes legibles para los errores de validación (422) de Pydantic
const MENSAJES_422: Record<string, string> = {
  missing: 'es obligatorio',
  string_too_short: 'es demasiado corto',
  string_too_long: 'es demasiado largo',
  too_short: 'debe tener al menos un elemento',
  finite_number: 'debe ser un número finito',
  greater_than: 'debe ser mayor a cero',
  greater_than_equal: 'no alcanza el valor mínimo permitido',
  less_than_equal: 'supera el valor máximo permitido',
  int_parsing: 'debe ser un número entero',
  float_parsing: 'debe ser un número',
  string_type: 'debe ser texto',
  literal_error: 'tiene un valor no permitido',
  value_error: 'no es válido',
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function nombreDelCampo(loc: unknown): string | null {
  if (!Array.isArray(loc)) return null
  const campo: unknown = [...loc].reverse().find((parte) => typeof parte === 'string' && parte !== 'body')
  if (typeof campo !== 'string') return null
  const texto = campo.replaceAll('_', ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function mensajeDeValidacion(item: unknown): string {
  if (!esObjeto(item)) return 'Datos inválidos'
  const campo = nombreDelCampo(item.loc)
  // Reglas propias del backend: el mensaje ya viene redactado en español
  if (item.type === 'value_error' && typeof item.msg === 'string') {
    const mensaje = item.msg.replace(/^Value error, /, '')
    return campo ? `${campo}: ${mensaje}` : mensaje
  }
  const traducido = typeof item.type === 'string' ? MENSAJES_422[item.type] : undefined
  if (traducido) return campo ? `${campo} ${traducido}` : traducido
  return campo ? `${campo} no es válido` : 'Datos inválidos'
}

/**
 * El "detail" del backend tiene dos formas:
 * - texto (400 / 401 / 403 / 404 / 409): "Stock insuficiente de ..."
 * - lista de objetos con loc/msg/type (422)
 */
export function formatDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) return detail.map(mensajeDeValidacion).join('. ')
  return null
}

/** Convierte cualquier error (idealmente de Axios) en un mensaje en español para mostrar en la UI. */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'El servidor tardó demasiado en responder. Intentá de nuevo.'
    }
    const response = error.response
    if (!response) return 'No se pudo conectar con el servidor. Verificá que el backend esté en ejecución.'
    if (response.status >= 500) return 'Ocurrió un error en el servidor. Intentá de nuevo en unos minutos.'
    const data: unknown = response.data
    const detalle = esObjeto(data) ? formatDetail(data.detail) : null
    if (response.status === 403) return detalle ?? 'No tenés permisos para realizar esta acción.'
    return detalle ?? `Error inesperado (${response.status})`
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

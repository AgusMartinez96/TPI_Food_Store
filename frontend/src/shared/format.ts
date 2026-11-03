const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const fecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

export function formatearMoneda(valor: number): string {
  return moneda.format(valor)
}

/** La API manda las fechas en UTC con Z: new Date las muestra en la hora local del navegador. */
export function formatearFecha(iso: string): string {
  return fecha.format(new Date(iso))
}

/** TanStack Form guarda los errores de un campo como lista de valores desconocidos. */
export function primerError(errores: readonly unknown[]): string | undefined {
  return errores.find((e): e is string => typeof e === 'string')
}

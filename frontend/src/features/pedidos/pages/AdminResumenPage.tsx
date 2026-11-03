import { EstadoError } from '../../../shared/components/EstadoError'
import { Skeleton } from '../../../shared/components/Skeleton'
import { formatearMoneda } from '../../../shared/format'
import { TarjetaResumen } from '../components/TarjetaResumen'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const { data, isPending, isError, error, refetch } = useResumenPedidos()

  return (
    <div>
      <h1 className="text-2xl font-bold">Resumen</h1>
      <p className="mt-1 text-sm text-stone-600">Cómo viene el negocio. Los pedidos de hoy cuentan desde la medianoche de Argentina.</p>
      <div className="mt-4">
        {isPending ? (
          <div role="status" aria-label="Cargando" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TarjetaResumen titulo="Pendientes" valor={String(data.pendientes)} acento="text-amber-700" ayuda="Esperando preparación" />
            <TarjetaResumen titulo="En preparación" valor={String(data.en_preparacion)} acento="text-blue-700" />
            <TarjetaResumen titulo="Entregados" valor={String(data.entregados)} acento="text-green-700" />
            <TarjetaResumen titulo="Cancelados" valor={String(data.cancelados)} acento="text-red-700" />
            <TarjetaResumen titulo="Pedidos de hoy" valor={String(data.pedidos_hoy)} />
            <TarjetaResumen
              titulo="Ingresos"
              valor={formatearMoneda(data.ingresos_entregados)}
              ayuda="Suma de los pedidos entregados"
              acento="text-orange-700"
            />
          </div>
        )}
      </div>
    </div>
  )
}

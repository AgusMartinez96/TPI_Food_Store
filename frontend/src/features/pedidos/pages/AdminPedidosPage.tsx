import { useState } from 'react'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearMoneda } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Select } from '../../../shared/ui/Input'
import { Modal } from '../../../shared/ui/Modal'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { TablaPedidos } from '../components/TablaPedidos'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS } from '../types/pedido'
import type { EstadoPedido, Pedido } from '../types/pedido'

const ETIQUETA: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export function AdminPedidosPage() {
  const [filtro, setFiltro] = useState<EstadoPedido | undefined>(undefined)
  const [viendo, setViendo] = useState<Pedido | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)

  // El panel pide hasta 100 pedidos (todos, porque es admin) y pagina del lado del cliente
  const { data, isPending, isError, error, refetch } = usePedidos({ skip: 0, limit: 100, estado: filtro })
  const cambiar = useCambiarEstadoPedido()

  function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
    cambiar.reset()
    if (estado === 'CANCELADO') {
      setACancelar(pedido) // cancelar devuelve el stock: se pide confirmación
      return
    }
    cambiar.mutate({ id: pedido.id, estado })
  }

  function confirmarCancelacion() {
    if (!aCancelar) return
    cambiar.mutate({ id: aCancelar.id, estado: 'CANCELADO' }, { onSuccess: () => setACancelar(null) })
  }

  function cerrarCancelacion() {
    setACancelar(null)
    cambiar.reset()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <p className="mt-1 text-sm text-stone-600">Todos los pedidos. Avanzá o cancelá según el estado.</p>

      <div className="mt-4 max-w-xs">
        <Select
          label="Filtrar por estado"
          value={filtro ?? ''}
          onChange={(e) => setFiltro(ESTADOS.find((estado) => estado === e.target.value))}
        >
          <option value="">Todos</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETA[estado]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-2 space-y-3">
        {cambiar.isError && !aCancelar && <Alert>{handleApiError(cambiar.error)}</Alert>}
        {isPending ? (
          <SkeletonFilas />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : data.items.length === 0 ? (
          <EstadoVacio titulo="No hay pedidos" descripcion={filtro ? 'Probá con otro estado.' : 'Todavía no se hicieron pedidos.'} />
        ) : (
          <TablaPedidos
            pedidos={data.items}
            deshabilitado={cambiar.isPending}
            onVer={setViendo}
            onCambiarEstado={cambiarEstado}
          />
        )}
      </div>

      <Modal abierto={viendo !== null} titulo={`Pedido #${viendo?.id ?? ''}`} onCerrar={() => setViendo(null)}>
        {viendo && <PedidoDetalle pedido={viendo} />}
      </Modal>

      <Modal abierto={aCancelar !== null} titulo="Cancelar pedido" onCerrar={cerrarCancelacion}>
        <p className="text-sm text-stone-700">
          ¿Cancelar el pedido #{aCancelar?.id} por {aCancelar ? formatearMoneda(aCancelar.total) : ''}? Los productos vuelven al stock y no se puede deshacer.
        </p>
        {cambiar.isError && (
          <div className="mt-3">
            <Alert>{handleApiError(cambiar.error)}</Alert>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variante="secondary" onClick={cerrarCancelacion}>
            Volver
          </Button>
          <Button variante="danger" cargando={cambiar.isPending} onClick={confirmarCancelacion}>
            Sí, cancelar pedido
          </Button>
        </div>
      </Modal>
    </div>
  )
}

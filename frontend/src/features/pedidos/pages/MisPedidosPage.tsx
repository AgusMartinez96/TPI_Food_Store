import { useState } from 'react'
import { Link } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { SkeletonFilas } from '../../../shared/components/Skeleton'
import { formatearFecha, formatearMoneda } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { useAuthStore } from '../../../store/authStore'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido'

const POR_PAGINA = 5

export function MisPedidosPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [pagina, setPagina] = useState(0)
  const [abierto, setAbierto] = useState<number | null>(null)
  const [aCancelar, setACancelar] = useState<Pedido | null>(null)

  // GET /pedidos devuelve TODOS los pedidos si quien llama es admin: se filtra por usuario_id
  // para que cada quien (admin incluido) vea solo los suyos. /admin/pedidos muestra todos.
  const { data, isPending, isError, error, refetch } = usePedidos({ skip: 0, limit: 100 })
  const cancelar = useCancelarPedido()

  const propios = data?.items.filter((p) => p.usuario_id === usuario?.id) ?? []
  const totalPaginas = Math.ceil(propios.length / POR_PAGINA)
  const visibles = propios.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)

  function confirmarCancelacion() {
    if (!aCancelar) return
    cancelar.mutate(aCancelar.id, { onSuccess: () => setACancelar(null) })
  }

  function cerrarModal() {
    setACancelar(null)
    cancelar.reset()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis pedidos</h1>
      <div className="mt-4 space-y-3">
        {isPending ? (
          <SkeletonFilas />
        ) : isError ? (
          <EstadoError error={error} onReintentar={() => void refetch()} />
        ) : propios.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hiciste pedidos"
            descripcion="Cuando confirmes uno, lo vas a ver acá."
            accion={
              <Link to="/" className="font-medium text-orange-700 hover:underline">
                Ir al catálogo
              </Link>
            }
          />
        ) : (
          <>
            {visibles.map((pedido) => (
              <Card key={pedido.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <p className="text-sm text-stone-500">{formatearFecha(pedido.created_at)}</p>
                  </div>
                  <BadgeEstado estado={pedido.estado} />
                  <p className="font-bold">{formatearMoneda(pedido.total)}</p>
                  <div className="flex gap-2">
                    <Button variante="secondary" onClick={() => setAbierto(abierto === pedido.id ? null : pedido.id)} aria-expanded={abierto === pedido.id}>
                      {abierto === pedido.id ? 'Ocultar detalle' : 'Ver detalle'}
                    </Button>
                    {pedido.estado === 'PENDIENTE' && (
                      <Button variante="danger" onClick={() => setACancelar(pedido)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
                {abierto === pedido.id && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <PedidoDetalle pedido={pedido} />
                  </div>
                )}
              </Card>
            ))}
            <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
          </>
        )}
      </div>

      <Modal abierto={aCancelar !== null} titulo="Cancelar pedido" onCerrar={cerrarModal}>
        <p className="text-sm text-stone-700">
          ¿Querés cancelar el pedido #{aCancelar?.id}? Los productos vuelven al stock y no se puede deshacer.
        </p>
        {cancelar.isError && (
          <div className="mt-3">
            <Alert>{handleApiError(cancelar.error)}</Alert>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variante="secondary" onClick={cerrarModal}>
            Volver
          </Button>
          <Button variante="danger" cargando={cancelar.isPending} onClick={confirmarCancelacion}>
            Sí, cancelar pedido
          </Button>
        </div>
      </Modal>
    </div>
  )
}

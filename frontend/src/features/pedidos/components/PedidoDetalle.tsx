import { formatearFecha, formatearMoneda } from '../../../shared/format'
import type { Pedido } from '../types/pedido'

const ETIQUETA_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

/** Detalle de un pedido: líneas con el nombre y el precio que tenían al comprar (RN-05). */
export function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="space-y-3 text-sm">
      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
        {pedido.items.map((linea) => (
          <li key={linea.producto_id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span>
              {linea.cantidad} × {linea.nombre_producto}
              <span className="block text-xs text-stone-500">{formatearMoneda(linea.precio_unitario)} c/u</span>
            </span>
            <span className="font-medium">{formatearMoneda(linea.subtotal)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between bg-stone-50 px-3 py-2 font-semibold">
          <span>Total</span>
          <span>{formatearMoneda(pedido.total)}</span>
        </li>
      </ul>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-stone-500">Entrega en</dt>
        <dd>{pedido.direccion_entrega}</dd>
        <dt className="text-stone-500">Pago</dt>
        <dd>{ETIQUETA_PAGO[pedido.forma_pago]}</dd>
        {pedido.notas && (
          <>
            <dt className="text-stone-500">Notas</dt>
            <dd>{pedido.notas}</dd>
          </>
        )}
        <dt className="text-stone-500">Creado</dt>
        <dd>{formatearFecha(pedido.created_at)}</dd>
        <dt className="text-stone-500">Última actualización</dt>
        <dd>{formatearFecha(pedido.updated_at)}</dd>
      </dl>
    </div>
  )
}

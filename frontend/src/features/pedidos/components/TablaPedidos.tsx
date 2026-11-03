import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../../../shared/components/DataTable'
import { formatearFecha, formatearMoneda } from '../../../shared/format'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import type { EstadoPedido, Pedido } from '../types/pedido'

interface Accion {
  estado: EstadoPedido
  texto: string
  variante: 'primary' | 'danger'
}

/** Espejo de la máquina de estados del backend (RN-02): qué botones se muestran según el estado actual. */
const ACCIONES: Record<EstadoPedido, Accion[]> = {
  PENDIENTE: [
    { estado: 'EN_PREPARACION', texto: 'Preparar', variante: 'primary' },
    { estado: 'CANCELADO', texto: 'Cancelar', variante: 'danger' },
  ],
  EN_PREPARACION: [
    { estado: 'ENTREGADO', texto: 'Entregar', variante: 'primary' },
    { estado: 'CANCELADO', texto: 'Cancelar', variante: 'danger' },
  ],
  ENTREGADO: [],
  CANCELADO: [],
}

interface TablaPedidosProps {
  pedidos: Pedido[]
  deshabilitado: boolean
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
}

export function TablaPedidos({ pedidos, deshabilitado, onVer, onCambiarEstado }: TablaPedidosProps) {
  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { id: 'id', header: '#', cell: ({ row }) => <span className="font-semibold">#{row.original.id}</span> },
      { id: 'usuario', header: 'Cliente', cell: ({ row }) => `Usuario #${row.original.usuario_id}` },
      { id: 'created_at', header: 'Fecha', cell: ({ row }) => formatearFecha(row.original.created_at) },
      { id: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      { id: 'forma_pago', header: 'Pago', cell: ({ row }) => (row.original.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia') },
      { id: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium">{formatearMoneda(row.original.total)}</span> },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button variante="secondary" onClick={() => onVer(row.original)}>
              Ver
            </Button>
            {ACCIONES[row.original.estado].map((accion) => (
              <Button
                key={accion.estado}
                variante={accion.variante}
                disabled={deshabilitado}
                onClick={() => onCambiarEstado(row.original, accion.estado)}
              >
                {accion.texto}
              </Button>
            ))}
          </div>
        ),
      },
    ],
    [deshabilitado, onVer, onCambiarEstado],
  )

  return <DataTable datos={pedidos} columnas={columnas} />
}

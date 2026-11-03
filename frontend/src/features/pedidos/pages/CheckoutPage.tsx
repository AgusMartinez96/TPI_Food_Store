import { Link, useNavigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { formatearMoneda } from '../../../shared/format'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm } from '../components/CheckoutForm'
import type { DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const vaciar = useCartStore((s) => s.vaciar)
  const crear = useCrearPedido()

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay nada para confirmar"
        descripcion="Tu carrito está vacío."
        accion={
          <Link to="/" className="font-medium text-orange-700 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  function enviar(datos: DatosCheckout) {
    crear.mutate(
      {
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: datos.forma_pago,
        direccion_entrega: datos.direccion_entrega,
        notas: datos.notas || null,
      },
      {
        // El pedido ya está creado: se vacía el carrito y se va a "Mis pedidos"
        onSuccess: () => {
          vaciar()
          navigate('/mis-pedidos')
        },
      },
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="text-2xl font-bold">Confirmar pedido</h1>
        <Card className="mt-4 p-5">
          <CheckoutForm onEnviar={enviar} enviando={crear.isPending} error={crear.isError ? handleApiError(crear.error) : null} />
        </Card>
      </div>
      <aside>
        <h2 className="text-lg font-semibold">Resumen</h2>
        <Card className="mt-4">
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-2">
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="font-medium">{formatearMoneda(i.precio_unitario * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 font-bold">
            <span>Total estimado</span>
            <span>{formatearMoneda(total)}</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">El precio final lo confirma el servidor al crear el pedido.</p>
        </Card>
      </aside>
    </div>
  )
}

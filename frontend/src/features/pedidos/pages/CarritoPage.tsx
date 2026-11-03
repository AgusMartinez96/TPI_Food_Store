import { Link, useNavigate } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { formatearMoneda } from '../../../shared/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'

export function CarritoPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const vaciar = useCartStore((s) => s.vaciar)

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        descripcion="Agregá productos del catálogo para armar tu pedido."
        accion={
          <Link to="/" className="font-medium text-orange-700 hover:underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Tu carrito</h1>
      <Card className="mt-4 p-0">
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <li key={item.producto_id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-40 flex-1">
                <p className="font-medium">{item.nombre}</p>
                <p className="text-sm text-stone-500">{formatearMoneda(item.precio_unitario)} c/u</p>
              </div>
              <div className="flex items-center gap-2" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                <Button
                  variante="secondary"
                  className="min-w-10 px-0"
                  aria-label={`Quitar una unidad de ${item.nombre}`}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                >
                  −
                </Button>
                <span className="w-8 text-center font-medium" aria-live="polite">
                  {item.cantidad}
                </span>
                <Button
                  variante="secondary"
                  className="min-w-10 px-0"
                  aria-label={`Agregar una unidad de ${item.nombre}`}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                >
                  +
                </Button>
              </div>
              <p className="w-28 text-right font-semibold">{formatearMoneda(item.precio_unitario * item.cantidad)}</p>
              <Button variante="secondary" onClick={() => quitar(item.producto_id)} aria-label={`Quitar ${item.nombre} del carrito`}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 p-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-xl font-bold">{formatearMoneda(total)}</span>
        </div>
      </Card>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button variante="secondary" onClick={vaciar}>
          Vaciar carrito
        </Button>
        <Button onClick={() => navigate('/checkout')}>Confirmar pedido</Button>
      </div>
    </div>
  )
}

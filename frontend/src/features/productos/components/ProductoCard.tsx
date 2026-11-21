import { useState } from 'react'
import { formatearMoneda } from '../../../shared/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types/producto'

export function ProductoCard({ producto }: { producto: Producto }) {
  const [imagenRota, setImagenRota] = useState(false)
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)

  const sinStock = producto.stock <= 0
  const noDisponible = !producto.disponible
  const llegoAlMaximo = !sinStock && enCarrito >= producto.stock
  // "Agregar al carrito" se deshabilita sin stock o si el producto no está disponible
  const deshabilitado = sinStock || noDisponible || llegoAlMaximo

  return (
    <Card className="flex h-full flex-col p-3">
      {producto.imagen_url && !imagenRota ? (
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          loading="lazy"
          onError={() => setImagenRota(true)}
          className="h-36 w-full rounded-lg object-cover"
          // foto vertical del agua: se encuadra sobre la etiqueta (las demás tarjetas siguen centradas)
          style={producto.imagen_url.includes('/imagenes/agua-mineral-500ml.jpg') ? { objectPosition: '50% 37%' } : undefined}
        />
      ) : (
        <div
          role="img"
          aria-label={`Sin imagen de ${producto.nombre}`}
          className="flex h-36 w-full items-center justify-center rounded-lg bg-orange-50 text-4xl"
        >
          🍽️
        </div>
      )}
      <div className="mt-3 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-orange-700">{producto.categoria.nombre}</p>
        <h3 className="mt-0.5 font-semibold text-stone-900">{producto.nombre}</h3>
        {producto.descripcion && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{producto.descripcion}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-stone-900">{formatearMoneda(producto.precio_base)}</span>
          {sinStock && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Sin stock</span>}
          {!sinStock && noDisponible && (
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">No disponible</span>
          )}
          {!sinStock && !noDisponible && producto.stock <= 5 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Quedan {producto.stock}
            </span>
          )}
        </div>
      </div>
      <Button
        className="mt-3 w-full"
        disabled={deshabilitado}
        onClick={() => agregar({ producto_id: producto.id, nombre: producto.nombre, precio_unitario: producto.precio_base })}
      >
        Agregar al carrito
      </Button>
      {enCarrito > 0 && (
        <p className="mt-1 text-center text-xs text-stone-500">
          {llegoAlMaximo ? 'Ya agregaste todo el stock disponible' : `En tu carrito: ${enCarrito}`}
        </p>
      )}
    </Card>
  )
}

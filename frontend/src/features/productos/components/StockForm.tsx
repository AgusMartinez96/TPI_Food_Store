import { useForm } from '@tanstack/react-form'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  onEnviar: (datos: Required<ProductoStockUpdate>) => void
  onCancelar: () => void
  enviando: boolean
  error: string | null
}

/** Cambia solo el stock y la disponibilidad (PATCH /productos/{id}/stock). */
export function StockForm({ producto, onEnviar, onCancelar, enviando, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: ({ value }) => onEnviar({ stock: Number(value.stock), disponible: value.disponible }),
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            const n = Number(value)
            if (value.trim() === '' || !Number.isInteger(n)) return 'El stock debe ser un número entero'
            if (n < 0) return 'El stock no puede ser negativo'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            label="Stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>
      <form.Field name="disponible">
        {(field) => (
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
            Disponible para la venta
          </label>
        )}
      </form.Field>
      {error && <Alert>{error}</Alert>}
      <div className="mt-4 flex justify-end gap-3">
        <Button variante="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          Guardar stock
        </Button>
      </div>
    </form>
  )
}

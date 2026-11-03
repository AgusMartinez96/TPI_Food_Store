import { useForm } from '@tanstack/react-form'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea } from '../../../shared/ui/Input'
import { FORMAS_PAGO } from '../types/pedido'
import type { FormaPago } from '../types/pedido'

export interface DatosCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string
}

interface CheckoutFormProps {
  onEnviar: (datos: DatosCheckout) => void
  enviando: boolean
  error: string | null
}

const ETIQUETA_PAGO: Record<FormaPago, string> = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' }

export function CheckoutForm({ onEnviar, enviando, error }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: ({ value }) => onEnviar({ ...value, direccion_entrega: value.direccion_entrega.trim(), notas: value.notas.trim() }),
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
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (largo > 200) return 'La dirección no puede superar los 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            label="Dirección de entrega"
            autoComplete="street-address"
            placeholder="Calle, número, piso"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <fieldset className="mb-3">
            <legend className="mb-1 text-sm font-medium text-stone-700">Forma de pago</legend>
            <div className="flex gap-3">
              {FORMAS_PAGO.map((forma) => (
                <label
                  key={forma}
                  className={`flex min-h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    field.state.value === forma ? 'border-orange-500 bg-orange-50' : 'border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="forma_pago"
                    checked={field.state.value === forma}
                    onChange={() => field.handleChange(forma)}
                  />
                  {ETIQUETA_PAGO[forma]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field name="notas">
        {(field) => (
          <Textarea
            label="Notas (opcional)"
            placeholder="Ej: sin cebolla, tocar timbre 2B"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      {error && <Alert>{error}</Alert>}
      <Button type="submit" cargando={enviando} className="mt-3 w-full">
        Confirmar pedido
      </Button>
    </form>
  )
}

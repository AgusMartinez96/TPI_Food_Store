import { useForm } from '@tanstack/react-form'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea } from '../../../shared/ui/Input'
import type { Categoria } from '../types/categoria'

export interface DatosCategoria {
  nombre: string
  descripcion: string
}

interface CategoriaFormProps {
  /** Si viene, el formulario edita esa categoría; si no, crea una nueva. */
  inicial?: Categoria
  onEnviar: (datos: DatosCategoria) => void
  onCancelar: () => void
  enviando: boolean
  error: string | null
}

export function CategoriaForm({ inicial, onEnviar, onCancelar, enviando, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: ({ value }) => onEnviar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() }),
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
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 2) return 'El nombre debe tener al menos 2 caracteres'
            if (largo > 100) return 'El nombre no puede superar los 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            label="Nombre"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>
      <form.Field name="descripcion">
        {(field) => (
          <Textarea
            label="Descripción (opcional)"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>
      {error && <Alert>{error}</Alert>}
      <div className="mt-4 flex justify-end gap-3">
        <Button variante="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={enviando}>
          {inicial ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}

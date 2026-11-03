import { useForm } from '@tanstack/react-form'
import type { Categoria } from '../../categorias/types/categoria'
import { primerError } from '../../../shared/format'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea } from '../../../shared/ui/Input'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  /** Si viene, el formulario edita ese producto; si no, crea uno nuevo. */
  inicial?: Producto
  categorias: Categoria[]
  onEnviar: (datos: ProductoCreate) => void
  onCancelar: () => void
  enviando: boolean
  error: string | null
}

export function ProductoForm({ inicial, categorias, onEnviar, onCancelar, enviando, error }: ProductoFormProps) {
  // Si la categoría actual del producto fue dada de baja no está en la lista de activas: se agrega para no perderla
  const opciones = inicial && !categorias.some((c) => c.id === inicial.categoria_id) ? [...categorias, inicial.categoria] : categorias

  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial ? String(inicial.precio_base) : '',
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial ? String(inicial.stock) : '0',
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial ? String(inicial.categoria_id) : '',
    },
    onSubmit: ({ value }) =>
      onEnviar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      }),
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
      <form.Field name="nombre" validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá el nombre del producto') }}>
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
      <div className="grid gap-x-3 sm:grid-cols-2">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() === '' || Number.isNaN(Number(value))) return 'Ingresá un precio válido'
              if (Number(value) < 0) return 'El precio no puede ser negativo'
              return undefined
            },
          }}
        >
          {(field) => (
            <Input
              label="Precio ($)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
            />
          )}
        </form.Field>
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
      </div>
      <form.Field name="categoria_id" validators={{ onChange: ({ value }) => (value ? undefined : 'Elegí una categoría') }}>
        {(field) => (
          <Select
            label="Categoría"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          >
            <option value="">Elegí una categoría…</option>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.activo ? '' : ' (dada de baja)'}
              </option>
            ))}
          </Select>
        )}
      </form.Field>
      <form.Field
        name="imagen_url"
        validators={{
          onChange: ({ value }) => (value.trim() === '' || /^https?:\/\//i.test(value.trim()) ? undefined : 'La imagen debe ser una URL que empiece con http:// o https://'),
        }}
      >
        {(field) => (
          <Input
            label="URL de la imagen (opcional)"
            type="url"
            placeholder="https://…"
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
          {inicial ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}

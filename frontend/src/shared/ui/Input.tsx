import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const CLASE_CAMPO =
  'block w-full min-h-10 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-2 focus:outline-orange-500 aria-[invalid=true]:border-red-500'

interface CampoProps {
  label: string
  error?: string
}

function Envoltorio({ id, label, error, children }: CampoProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      <p id={`${id}-error`} aria-live="polite" className="mt-1 min-h-4 text-xs text-red-600">
        {error}
      </p>
    </div>
  )
}

export function Input({ label, error, id, ...resto }: CampoProps & InputHTMLAttributes<HTMLInputElement>) {
  const idAuto = useId()
  const campoId = id ?? idAuto
  return (
    <Envoltorio id={campoId} label={label} error={error}>
      <input id={campoId} className={CLASE_CAMPO} aria-invalid={error ? true : undefined} aria-describedby={`${campoId}-error`} {...resto} />
    </Envoltorio>
  )
}

export function Select({ label, error, id, children, ...resto }: CampoProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const idAuto = useId()
  const campoId = id ?? idAuto
  return (
    <Envoltorio id={campoId} label={label} error={error}>
      <select id={campoId} className={CLASE_CAMPO} aria-invalid={error ? true : undefined} aria-describedby={`${campoId}-error`} {...resto}>
        {children}
      </select>
    </Envoltorio>
  )
}

export function Textarea({ label, error, id, ...resto }: CampoProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const idAuto = useId()
  const campoId = id ?? idAuto
  return (
    <Envoltorio id={campoId} label={label} error={error}>
      <textarea id={campoId} rows={3} className={CLASE_CAMPO} aria-invalid={error ? true : undefined} aria-describedby={`${campoId}-error`} {...resto} />
    </Envoltorio>
  )
}

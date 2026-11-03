import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean
}

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:outline-orange-600',
  secondary: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus-visible:outline-stone-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
}

export function Button({
  variante = 'primary',
  cargando = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...resto}
    >
      {cargando ? 'Procesando…' : children}
    </button>
  )
}

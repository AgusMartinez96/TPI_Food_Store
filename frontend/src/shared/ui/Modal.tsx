import type { ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

/** Diálogo accesible: se cierra con Esc o haciendo clic afuera. El foco se mueve al diálogo al abrir. */
export function Modal({ abierto, titulo, onCerrar, children }: ModalProps) {
  if (!abierto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        ref={(el) => el?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCerrar()
        }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-stone-900">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-stone-500 hover:bg-stone-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

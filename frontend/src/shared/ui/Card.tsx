import type { HTMLAttributes } from 'react'

export function Card({ className = '', children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm ${className}`} {...resto}>
      {children}
    </div>
  )
}

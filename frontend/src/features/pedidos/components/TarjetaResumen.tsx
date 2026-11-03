import { Card } from '../../../shared/ui/Card'

interface TarjetaResumenProps {
  titulo: string
  valor: string
  ayuda?: string
  acento?: string
}

export function TarjetaResumen({ titulo, valor, ayuda, acento = 'text-stone-900' }: TarjetaResumenProps) {
  return (
    <Card>
      <p className="text-sm font-medium text-stone-600">{titulo}</p>
      <p className={`mt-2 text-3xl font-bold ${acento}`}>{valor}</p>
      {ayuda && <p className="mt-1 text-xs text-stone-500">{ayuda}</p>}
    </Card>
  )
}

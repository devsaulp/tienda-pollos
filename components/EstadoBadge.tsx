import { infoEstado } from '@/lib/utils'
import type { EstadoPedido } from '@/lib/types'

export default function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const info = infoEstado(estado)
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.clases}`}>
      {info.etiqueta}
    </span>
  )
}

import type { EstadoPedido, Etapa } from './types'

/** Formatea un numero como precio en soles: S/ 128.00 */
export function soles(monto: number) {
  return `S/ ${Number(monto).toFixed(2)}`
}

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ETAPAS: { valor: Etapa; etiqueta: string }[] = [
  { valor: 'inicio', etiqueta: 'Inicio (1-21 días)' },
  { valor: 'crecimiento', etiqueta: 'Crecimiento (22-35 días)' },
  { valor: 'acabado', etiqueta: 'Acabado / Engorde' },
  { valor: 'postura', etiqueta: 'Postura' },
  { valor: 'otro', etiqueta: 'Otros' },
]

export function etiquetaEtapa(etapa: Etapa | null) {
  return ETAPAS.find((e) => e.valor === etapa)?.etiqueta ?? '—'
}

export const ESTADOS: { valor: EstadoPedido; etiqueta: string; clases: string }[] = [
  { valor: 'pendiente', etiqueta: 'Pendiente', clases: 'bg-yellow-100 text-yellow-800' },
  { valor: 'confirmado', etiqueta: 'Confirmado', clases: 'bg-blue-100 text-blue-800' },
  { valor: 'en_reparto', etiqueta: 'En reparto', clases: 'bg-purple-100 text-purple-800' },
  { valor: 'entregado', etiqueta: 'Entregado', clases: 'bg-green-100 text-green-800' },
  { valor: 'cancelado', etiqueta: 'Cancelado', clases: 'bg-red-100 text-red-700' },
]

export function infoEstado(estado: EstadoPedido) {
  return ESTADOS.find((e) => e.valor === estado) ?? ESTADOS[0]
}

export const METODOS_PAGO: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  contra_entrega: 'Contra entrega',
}

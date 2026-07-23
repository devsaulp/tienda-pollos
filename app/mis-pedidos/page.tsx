import Link from 'next/link'
import { PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EstadoBadge from '@/components/EstadoBadge'
import { METODOS_PAGO, fechaCorta, soles } from '@/lib/utils'
import type { Pedido, PedidoItem } from '@/lib/types'

export const revalidate = 0

type PedidoConItems = Pedido & {
  pedido_items: (PedidoItem & { productos: { nombre: string; presentacion_kg: number } | null })[]
}

export default async function MisPedidosPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // RLS ya limita a los pedidos propios; el filtro explicito es defensa extra
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, pedido_items(*, productos(nombre, presentacion_kg))')
    .eq('usuario_id', user!.id)
    .order('created_at', { ascending: false })

  const lista = (pedidos ?? []) as PedidoConItems[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800">Mis pedidos</h1>

      {lista.length === 0 ? (
        <div className="py-20 text-center">
          <PackageOpen size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">Todavía no tienes pedidos registrados.</p>
          <Link href="/productos" className="btn-primario mt-6">
            Hacer mi primer pedido
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {lista.map((pedido) => (
            <details key={pedido.id} className="card group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-bold text-gray-800">{pedido.codigo}</p>
                  <p className="text-xs text-gray-500">{fechaCorta(pedido.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-agro-700">{soles(pedido.total)}</span>
                  <EstadoBadge estado={pedido.estado} />
                </div>
              </summary>

              <div className="border-t border-gray-100 p-4 text-sm">
                <ul className="space-y-1.5">
                  {pedido.pedido_items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span className="text-gray-600">
                        {item.cantidad} × {item.productos?.nombre ?? 'Producto'}
                      </span>
                      <span className="font-medium">{soles(item.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid gap-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <p>Pago: {pedido.metodo_pago ? METODOS_PAGO[pedido.metodo_pago] : '—'}</p>
                  <p>Entrega: {pedido.direccion_entrega ?? '—'}</p>
                  {pedido.notas && <p>Notas: {pedido.notas}</p>}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import EstadoBadge from '@/components/EstadoBadge'
import { ESTADOS, METODOS_PAGO, fechaCorta, soles } from '@/lib/utils'
import type { EstadoPedido, Pedido, PedidoItem } from '@/lib/types'

type PedidoCompleto = Pedido & {
  perfiles: { nombre: string | null; telefono: string | null } | null
  pedido_items: (PedidoItem & { productos: { nombre: string; presentacion_kg: number } | null })[]
}

export default function AdminPedidosPage() {
  const supabase = createClient()

  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([])
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos')
  const [abierto, setAbierto] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cargarPedidos() {
    setCargando(true)
    let consulta = supabase
      .from('pedidos')
      .select('*, perfiles(nombre, telefono), pedido_items(*, productos(nombre, presentacion_kg))')
      .order('created_at', { ascending: false })
    if (filtro !== 'todos') consulta = consulta.eq('estado', filtro)
    const { data } = await consulta
    setPedidos((data ?? []) as PedidoCompleto[])
    setCargando(false)
  }

  useEffect(() => {
    cargarPedidos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro])

  // El cambio de estado pasa por la RPC: si se cancela, repone el stock
  async function cambiarEstado(pedidoId: string, estado: EstadoPedido) {
    setError(null)
    setActualizando(pedidoId)
    const { error: errorRpc } = await supabase.rpc('cambiar_estado_pedido', {
      p_pedido_id: pedidoId,
      p_estado: estado,
    })
    setActualizando(null)
    if (errorRpc) {
      setError(errorRpc.message)
      return
    }
    await cargarPedidos()
  }

  // El comprobante esta en un bucket privado: se genera un enlace firmado temporal
  async function verComprobante(ruta: string) {
    const { data, error: errorFirma } = await supabase.storage
      .from('comprobantes')
      .createSignedUrl(ruta, 60 * 10) // valido por 10 minutos
    if (errorFirma || !data) {
      setError('No se pudo abrir el comprobante.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>

      {/* Filtro por estado */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro('todos')}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            filtro === 'todos' ? 'border-agro-600 bg-agro-600 text-white' : 'border-gray-300 bg-white text-gray-600'
          }`}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e.valor}
            onClick={() => setFiltro(e.valor)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              filtro === e.valor ? 'border-agro-600 bg-agro-600 text-white' : 'border-gray-300 bg-white text-gray-600'
            }`}
          >
            {e.etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="mt-10 text-center text-gray-500">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">No hay pedidos con este filtro.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {pedidos.map((pedido) => {
            const estaAbierto = abierto === pedido.id
            return (
              <div key={pedido.id} className="card">
                {/* Cabecera */}
                <button
                  onClick={() => setAbierto(estaAbierto ? null : pedido.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left"
                >
                  <div>
                    <p className="font-bold text-gray-800">{pedido.codigo}</p>
                    <p className="text-xs text-gray-500">
                      {pedido.perfiles?.nombre ?? 'Cliente'} · {fechaCorta(pedido.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-agro-700">{soles(pedido.total)}</span>
                    <EstadoBadge estado={pedido.estado} />
                    {estaAbierto ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {/* Detalle */}
                {estaAbierto && (
                  <div className="border-t border-gray-100 p-4 text-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-700">Items del pedido</h3>
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
                      </div>

                      <div className="space-y-1.5 text-gray-600">
                        <h3 className="mb-2 font-semibold text-gray-700">Datos del cliente</h3>
                        <p>Nombre: {pedido.perfiles?.nombre ?? '—'}</p>
                        <p>Teléfono: {pedido.telefono_contacto ?? pedido.perfiles?.telefono ?? '—'}</p>
                        <p>Dirección: {pedido.direccion_entrega ?? '—'}</p>
                        <p>Pago: {pedido.metodo_pago ? METODOS_PAGO[pedido.metodo_pago] : '—'}</p>
                        {pedido.notas && <p>Notas: {pedido.notas}</p>}
                        {pedido.comprobante_url && (
                          <button
                            onClick={() => verComprobante(pedido.comprobante_url!)}
                            className="mt-1 inline-flex items-center gap-1.5 font-semibold text-agro-700 hover:underline"
                          >
                            <ImageIcon size={15} /> Ver comprobante de pago
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cambiar estado */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Cambiar estado
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ESTADOS.filter((e) => e.valor !== pedido.estado).map((e) => (
                          <button
                            key={e.valor}
                            disabled={actualizando === pedido.id}
                            onClick={() => cambiarEstado(pedido.id, e.valor)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              e.valor === 'cancelado'
                                ? 'border-red-300 text-red-600 hover:bg-red-50'
                                : 'border-gray-300 text-gray-600 hover:border-agro-600 hover:text-agro-700'
                            }`}
                          >
                            {e.valor === 'cancelado' ? 'Cancelar (repone stock)' : `Marcar ${e.etiqueta.toLowerCase()}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

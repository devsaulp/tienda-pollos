'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, MessageCircle, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/components/CartProvider'
import { soles } from '@/lib/utils'
import { NUMERO_WHATSAPP, NUMERO_YAPE } from '@/lib/config'
import type { MetodoPago } from '@/lib/types'

interface PedidoCreado {
  codigo: string
  total: number
}

export default function CheckoutPage() {
  const { items, total, vaciar, cargado } = useCart()
  const supabase = createClient()

  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('yape')
  const [notas, setNotas] = useState('')
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pedidoCreado, setPedidoCreado] = useState<PedidoCreado | null>(null)

  // Prellenar direccion y telefono desde el perfil del usuario
  useEffect(() => {
    async function cargarPerfil() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('telefono, direccion')
        .eq('id', auth.user.id)
        .single()
      if (perfil) {
        setDireccion(perfil.direccion ?? '')
        setTelefono(perfil.telefono ?? '')
      }
    }
    cargarPerfil()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmarPedido(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Tu carrito está vacío.')
      return
    }
    if ((metodo === 'yape' || metodo === 'plin') && !comprobante) {
      setError('Sube la imagen de tu comprobante de pago para continuar.')
      return
    }

    setEnviando(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error('Debes iniciar sesión')

      // 1. Subir comprobante (si aplica) a la carpeta privada del usuario
      let rutaComprobante: string | null = null
      if (comprobante) {
        const extension = comprobante.name.split('.').pop() ?? 'jpg'
        rutaComprobante = `${auth.user.id}/${Date.now()}.${extension}`
        const { error: errorSubida } = await supabase.storage
          .from('comprobantes')
          .upload(rutaComprobante, comprobante)
        if (errorSubida) throw new Error('No se pudo subir el comprobante. Intenta de nuevo.')
      }

      // 2. Crear el pedido via RPC (valida y descuenta stock en una transaccion)
      const { data, error: errorRpc } = await supabase.rpc('crear_pedido', {
        p_items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        p_metodo_pago: metodo,
        p_direccion_entrega: direccion,
        p_telefono_contacto: telefono,
        p_notas: notas || null,
        p_comprobante_url: rutaComprobante,
      })

      if (errorRpc) throw new Error(errorRpc.message)

      const resultado = Array.isArray(data) ? data[0] : data
      setPedidoCreado({ codigo: resultado.codigo, total: Number(resultado.total) })
      vaciar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al crear el pedido.')
    } finally {
      setEnviando(false)
    }
  }

  // ---------- Pantalla de exito ----------
  if (pedidoCreado) {
    const mensaje = `Hola, acabo de realizar el pedido ${pedidoCreado.codigo} por ${soles(
      pedidoCreado.total
    )}. Quedo atento a la confirmación.`
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 size={56} className="mx-auto text-agro-600" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">¡Pedido registrado!</h1>
        <p className="mt-2 text-gray-600">
          Tu código de pedido es <span className="font-bold text-agro-700">{pedidoCreado.codigo}</span> por un total de{' '}
          <span className="font-bold">{soles(pedidoCreado.total)}</span>.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Confirmaremos tu pago y coordinaremos la entrega. Puedes ver el avance en "Mis pedidos".
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario bg-[#25D366] hover:bg-[#1fb958]"
          >
            <MessageCircle size={18} /> Avisar por WhatsApp
          </a>
          <Link href="/mis-pedidos" className="btn-secundario">
            Ver mis pedidos
          </Link>
        </div>
      </div>
    )
  }

  if (!cargado) return null

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-gray-500">Tu carrito está vacío.</p>
        <Link href="/productos" className="btn-primario mt-4">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  // ---------- Formulario de checkout ----------
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800">Confirmar pedido</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        <form onSubmit={confirmarPedido} className="space-y-5 md:col-span-3">
          <div className="card space-y-4 p-5">
            <h2 className="font-semibold text-gray-800">Datos de entrega</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Dirección de entrega</label>
              <input required value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono de contacto</label>
              <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input"
                rows={2}
                placeholder="Referencia, horario preferido, etc."
              />
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="font-semibold text-gray-800">Método de pago</h2>
            <div className="grid grid-cols-3 gap-2">
              {(['yape', 'plin', 'contra_entrega'] as MetodoPago[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodo(m)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                    metodo === m ? 'border-agro-600 bg-agro-50 text-agro-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {m === 'contra_entrega' ? 'Contra entrega' : m}
                </button>
              ))}
            </div>

            {(metodo === 'yape' || metodo === 'plin') && (
              <div className="rounded-lg bg-maiz-100 p-4 text-sm">
                <p className="font-semibold text-gray-800">
                  {metodo === 'yape' ? 'Yapea' : 'Plinea'} al número:{' '}
                  <span className="text-lg font-extrabold">{NUMERO_YAPE}</span>
                </p>
                <p className="mt-1 text-gray-600">Luego sube la captura de tu comprobante aquí:</p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-400 bg-white p-3 text-gray-600 hover:border-agro-600">
                  <Upload size={18} />
                  <span className="text-sm">{comprobante ? comprobante.name : 'Seleccionar imagen del voucher'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}

            {metodo === 'contra_entrega' && (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                Pagas en efectivo o Yape al momento de recibir tus sacos. Coordinaremos la entrega por teléfono.
              </p>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={enviando} className="btn-primario w-full">
            {enviando ? 'Registrando pedido...' : `Confirmar pedido · ${soles(total)}`}
          </button>
        </form>

        {/* Resumen */}
        <aside className="md:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800">Resumen</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="text-gray-600">
                    {i.cantidad} × {i.nombre}
                  </span>
                  <span className="font-medium text-gray-800">{soles(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 font-bold">
              <span>Total</span>
              <span className="text-agro-700">{soles(total)}</span>
            </div>
            {/* CONFIGURAR: si defines costo de envio, sumalo aqui y en la RPC */}
          </div>
        </aside>
      </div>
    </div>
  )
}

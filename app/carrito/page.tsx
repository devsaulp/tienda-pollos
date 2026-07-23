'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { soles } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CarritoPage() {
  const { items, actualizarCantidad, quitar, total, cargado } = useCart()
  const router = useRouter()
  const supabase = createClient()

  async function irACheckout() {
    // El checkout exige sesion: si no hay, mandar a login con retorno
    const { data } = await supabase.auth.getUser()
    router.push(data.user ? '/checkout' : '/login?next=/checkout')
  }

  if (!cargado) return null

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-700">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-gray-500">Agrega sacos desde el catálogo para armar tu pedido.</p>
        <Link href="/productos" className="btn-primario mt-6">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800">Tu carrito</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-agro-50">
              {item.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-cover" />
              ) : (
                <Package size={26} className="text-agro-600/40" />
              )}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-gray-800">{item.nombre}</p>
              <p className="text-sm text-gray-500">
                {soles(item.precio)} · Saco de {item.presentacion_kg} kg
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-gray-300">
                <button
                  onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                  className="p-2 text-gray-600"
                  aria-label="Menos"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                <button
                  onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                  className="p-2 text-gray-600"
                  aria-label="Más"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="w-24 text-right font-bold text-gray-800">{soles(item.precio * item.cantidad)}</span>
              <button onClick={() => quitar(item.id)} className="text-gray-400 hover:text-red-500" aria-label="Quitar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Total del pedido</p>
          <p className="text-2xl font-extrabold text-agro-700">{soles(total)}</p>
        </div>
        <button onClick={irACheckout} className="btn-primario">
          Realizar pedido
        </button>
      </div>
    </div>
  )
}

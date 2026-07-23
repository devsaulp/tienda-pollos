import Link from 'next/link'
import { BadgeCheck, Egg, MessageCircle, Tractor, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { NOMBRE_EMPRESA, linkWhatsApp } from '@/lib/config'
import type { Categoria, Producto } from '@/lib/types'

export const revalidate = 0

export default async function LandingPage() {
  const supabase = createClient()

  const [{ data: categorias }, { data: destacados }] = await Promise.all([
    supabase.from('categorias').select('*').order('orden'),
    // CONFIGURAR: aqui se muestran los primeros productos activos como "mas vendidos".
    // Si luego registras ventas, puedes ordenar por unidades vendidas.
    supabase.from('productos').select('*').eq('activo', true).gt('stock', 0).limit(4),
  ])

  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-agro-700 via-agro-600 to-agro-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="mb-3 inline-block rounded-full bg-maiz-400 px-3 py-1 text-xs font-bold text-gray-900">
              Directo del distribuidor a tu galpón
            </span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
              Alimento balanceado para que tus pollos rindan más
            </h1>
            <p className="mt-4 text-agro-100">
              En {NOMBRE_EMPRESA} encuentras alimento de inicio, crecimiento, engorde y postura con fórmulas
              balanceadas y precios justos. Haz tu pedido online y paga con Yape, Plin o contra entrega.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/productos" className="btn-primario bg-maiz-400 !text-gray-900 hover:bg-maiz-500">
                Ver catálogo
              </Link>
              <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="btn-secundario border-white !text-white hover:bg-white/10">
                <MessageCircle size={18} /> Consultar por WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="flex h-64 w-64 items-center justify-center rounded-full bg-white/10">
              <Egg size={110} className="text-maiz-400" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Categorías</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(categorias as Categoria[] | null)?.map((cat) => (
            <Link
              key={cat.id}
              href={`/productos?categoria=${cat.id}`}
              className="card p-5 transition hover:border-agro-600 hover:shadow-md"
            >
              <h3 className="font-semibold text-agro-700">{cat.nombre}</h3>
              <p className="mt-1 text-sm text-gray-500">{cat.descripcion}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* MAS VENDIDOS */}
      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Los más pedidos</h2>
          <Link href="/productos" className="text-sm font-semibold text-agro-700 hover:underline">
            Ver todo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(destacados as Producto[] | null)?.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>

      {/* POR QUE ELEGIRNOS */}
      <section className="mt-12 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">¿Por qué elegirnos?</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <BadgeCheck size={36} className="mx-auto text-agro-600" />
              <h3 className="mt-3 font-semibold">Fórmulas comprobadas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Alimento fresco con la proteína y energía que cada etapa del ave necesita.
              </p>
            </div>
            <div className="text-center">
              <Truck size={36} className="mx-auto text-agro-600" />
              <h3 className="mt-3 font-semibold">Entrega a tu granja</h3>
              <p className="mt-1 text-sm text-gray-500">
                Llevamos tus sacos hasta tu galpón. Coordina la entrega al confirmar tu pedido.
              </p>
            </div>
            <div className="text-center">
              <Tractor size={36} className="mx-auto text-agro-600" />
              <h3 className="mt-3 font-semibold">Asesoría al productor</h3>
              <p className="mt-1 text-sm text-gray-500">
                Te ayudamos a elegir el alimento correcto según la edad y el objetivo de tu crianza.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

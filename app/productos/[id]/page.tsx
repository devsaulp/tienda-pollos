import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductDetailActions from '@/components/ProductDetailActions'
import { etiquetaEtapa, soles } from '@/lib/utils'
import type { Producto } from '@/lib/types'

export const revalidate = 0

export default async function ProductoDetallePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: producto } = await supabase
    .from('productos')
    .select('*, categorias(nombre)')
    .eq('id', params.id)
    .eq('activo', true)
    .single()

  if (!producto) notFound()

  const p = producto as Producto & { categorias: { nombre: string } | null }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/productos" className="inline-flex items-center gap-1 text-sm text-agro-700 hover:underline">
        <ChevronLeft size={16} /> Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="card flex h-80 items-center justify-center overflow-hidden bg-agro-50">
          {p.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" />
          ) : (
            <Package size={80} className="text-agro-600/40" />
          )}
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-agro-600">
            {p.categorias?.nombre ?? 'Producto'}
          </span>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">{p.nombre}</h1>
          <p className="mt-3 text-3xl font-extrabold text-agro-700">{soles(p.precio)}</p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{p.descripcion}</p>

          {/* Tabla de informacion */}
          <table className="mt-6 w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-medium text-gray-500">Etapa del ave</td>
                <td className="py-2 text-right text-gray-800">{etiquetaEtapa(p.etapa)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-medium text-gray-500">Presentación</td>
                <td className="py-2 text-right text-gray-800">Saco de {Number(p.presentacion_kg)} kg</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-500">Stock disponible</td>
                <td className={`py-2 text-right font-semibold ${p.stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                  {p.stock > 0 ? `${p.stock} sacos` : 'Agotado'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Selector de cantidad + agregar (componente cliente) */}
          <ProductDetailActions producto={p} />
        </div>
      </div>
    </div>
  )
}

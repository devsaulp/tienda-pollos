import Link from 'next/link'
import { Package } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import { etiquetaEtapa, soles } from '@/lib/utils'
import type { Producto } from '@/lib/types'

export default function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link href={`/productos/${producto.id}`} className="block">
        <div className="flex h-44 items-center justify-center bg-agro-50">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" />
          ) : (
            <Package size={48} className="text-agro-600/40" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-agro-600">
          {etiquetaEtapa(producto.etapa)}
        </span>
        <Link href={`/productos/${producto.id}`} className="font-semibold leading-snug text-gray-800 hover:text-agro-700">
          {producto.nombre}
        </Link>
        <p className="text-sm text-gray-500">Saco de {Number(producto.presentacion_kg)} kg</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-xl font-bold text-agro-700">{soles(producto.precio)}</span>
          <span className={`text-xs ${producto.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
            Stock: {producto.stock}
          </span>
        </div>
        <AddToCartButton producto={producto} className="mt-2 w-full text-sm" />
      </div>
    </div>
  )
}

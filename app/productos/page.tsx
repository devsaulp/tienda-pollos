import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { ETAPAS } from '@/lib/utils'
import type { Categoria, Producto } from '@/lib/types'

export const revalidate = 0

interface Props {
  searchParams: { categoria?: string; etapa?: string; q?: string }
}

export default async function ProductosPage({ searchParams }: Props) {
  const supabase = createClient()

  const { data: categorias } = await supabase.from('categorias').select('*').order('orden')

  let consulta = supabase.from('productos').select('*').eq('activo', true).order('nombre')
  if (searchParams.categoria) consulta = consulta.eq('categoria_id', searchParams.categoria)
  if (searchParams.etapa) consulta = consulta.eq('etapa', searchParams.etapa)
  if (searchParams.q) consulta = consulta.ilike('nombre', `%${searchParams.q}%`)
  const { data: productos } = await consulta

  // Helper para armar URLs conservando los demas filtros
  const url = (cambios: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { ...searchParams, ...cambios }
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v))
    const qs = params.toString()
    return `/productos${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800">Catálogo de productos</h1>

      {/* Buscador (form GET) */}
      <form action="/productos" method="get" className="mt-4 flex max-w-md gap-2">
        {searchParams.categoria && <input type="hidden" name="categoria" value={searchParams.categoria} />}
        {searchParams.etapa && <input type="hidden" name="etapa" value={searchParams.etapa} />}
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por nombre..."
          className="input"
        />
        <button type="submit" className="btn-primario px-3" aria-label="Buscar">
          <Search size={18} />
        </button>
      </form>

      {/* Filtro por categoria */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={url({ categoria: undefined })}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            !searchParams.categoria ? 'border-agro-600 bg-agro-600 text-white' : 'border-gray-300 bg-white text-gray-600'
          }`}
        >
          Todas
        </Link>
        {(categorias as Categoria[] | null)?.map((cat) => (
          <Link
            key={cat.id}
            href={url({ categoria: cat.id })}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              searchParams.categoria === cat.id
                ? 'border-agro-600 bg-agro-600 text-white'
                : 'border-gray-300 bg-white text-gray-600'
            }`}
          >
            {cat.nombre}
          </Link>
        ))}
      </div>

      {/* Filtro por etapa del ave */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={url({ etapa: undefined })}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !searchParams.etapa ? 'border-maiz-500 bg-maiz-100 text-gray-800' : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          Toda etapa
        </Link>
        {ETAPAS.map((e) => (
          <Link
            key={e.valor}
            href={url({ etapa: e.valor })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              searchParams.etapa === e.valor
                ? 'border-maiz-500 bg-maiz-100 text-gray-800'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            {e.etiqueta}
          </Link>
        ))}
      </div>

      {/* Resultados */}
      {productos && productos.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(productos as Producto[]).map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-gray-500">
          No se encontraron productos con esos filtros. Prueba con otra búsqueda.
        </p>
      )}
    </div>
  )
}

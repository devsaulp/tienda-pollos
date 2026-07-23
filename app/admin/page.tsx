import Link from 'next/link'
import { AlertTriangle, Banknote, ClipboardList, PackageSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { STOCK_BAJO } from '@/lib/config'
import { soles } from '@/lib/utils'
import type { Producto } from '@/lib/types'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()

  const [pedidosHoy, pedidosPendientes, ventasMes, stockBajo] = await Promise.all([
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).gte('created_at', inicioHoy),
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('pedidos').select('total').gte('created_at', inicioMes).neq('estado', 'cancelado'),
    supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .lte('stock', STOCK_BAJO)
      .order('stock'),
  ])

  const totalVentasMes = (ventasMes.data ?? []).reduce((acc, p) => acc + Number(p.total), 0)
  const productosStockBajo = (stockBajo.data ?? []) as Producto[]

  const tarjetas = [
    { titulo: 'Pedidos de hoy', valor: String(pedidosHoy.count ?? 0), icono: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { titulo: 'Pedidos pendientes', valor: String(pedidosPendientes.count ?? 0), icono: PackageSearch, color: 'text-yellow-600 bg-yellow-50' },
    { titulo: 'Ventas del mes', valor: soles(totalVentasMes), icono: Banknote, color: 'text-agro-600 bg-agro-50' },
    { titulo: `Stock bajo (≤ ${STOCK_BAJO})`, valor: String(productosStockBajo.length), icono: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="card p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${t.color}`}>
              <t.icono size={20} />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-gray-800">{t.valor}</p>
            <p className="text-sm text-gray-500">{t.titulo}</p>
          </div>
        ))}
      </div>

      {productosStockBajo.length > 0 && (
        <div className="card mt-8 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <AlertTriangle size={18} className="text-red-500" /> Productos con stock bajo
          </h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {productosStockBajo.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <span className="text-gray-700">{p.nombre}</span>
                <span className="font-bold text-red-600">{p.stock} sacos</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/productos" className="btn-secundario mt-4 text-sm">
            Reponer stock
          </Link>
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardList, LayoutDashboard, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

// Segunda barrera ademas del middleware: verificar rol admin en el servidor.
// Nunca se confia en el rol enviado desde el cliente.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') redirect('/')

  const enlaces = [
    { href: '/admin', texto: 'Dashboard', icono: LayoutDashboard },
    { href: '/admin/productos', texto: 'Productos', icono: Package },
    { href: '/admin/pedidos', texto: 'Pedidos', icono: ClipboardList },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
        {enlaces.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-agro-50 hover:text-agro-700"
          >
            <e.icono size={16} /> {e.texto}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}

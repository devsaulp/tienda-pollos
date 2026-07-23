'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, ShoppingCart, User, Wheat, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from './CartProvider'
import { NOMBRE_EMPRESA } from '@/lib/config'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const { cantidadTotal } = useCart()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Sesion actual + suscripcion a cambios de auth
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setUser(sesion?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return setEsAdmin(false)
    supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setEsAdmin(data?.rol === 'admin'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => setMenuAbierto(false), [pathname])

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const enlaces = [
    { href: '/', texto: 'Inicio' },
    { href: '/productos', texto: 'Productos' },
    ...(user ? [{ href: '/mis-pedidos', texto: 'Mis pedidos' }] : []),
    ...(esAdmin ? [{ href: '/admin', texto: 'Panel admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-agro-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-agro-600 text-white">
            <Wheat size={18} />
          </span>
          <span className="text-lg">{NOMBRE_EMPRESA}</span>
        </Link>

        {/* Enlaces escritorio */}
        <div className="hidden items-center gap-6 md:flex">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={`text-sm font-medium transition hover:text-agro-700 ${
                pathname === e.href ? 'text-agro-700' : 'text-gray-600'
              }`}
            >
              {e.texto}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/carrito" className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100" aria-label="Carrito">
            <ShoppingCart size={22} />
            {cantidadTotal > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-maiz-400 text-xs font-bold text-gray-900">
                {cantidadTotal}
              </span>
            )}
          </Link>

          {user ? (
            <button onClick={cerrarSesion} className="hidden text-sm font-medium text-gray-600 hover:text-agro-700 md:block">
              Cerrar sesión
            </button>
          ) : (
            <Link href="/login" className="hidden items-center gap-1 text-sm font-medium text-gray-600 hover:text-agro-700 md:flex">
              <User size={18} /> Ingresar
            </Link>
          )}

          {/* Boton menu movil */}
          <button
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Menu movil */}
      {menuAbierto && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className="block py-2.5 text-sm font-medium text-gray-700">
              {e.texto}
            </Link>
          ))}
          {user ? (
            <button onClick={cerrarSesion} className="py-2.5 text-sm font-medium text-red-600">
              Cerrar sesión
            </button>
          ) : (
            <Link href="/login" className="block py-2.5 text-sm font-medium text-agro-700">
              Ingresar / Registrarse
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

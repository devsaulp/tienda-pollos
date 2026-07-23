'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegistroPage() {
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const actualizar = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }))

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    // Los datos extra viajan en metadata: el trigger handle_new_user
    // los copia automaticamente a la tabla perfiles.
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nombre: form.nombre, telefono: form.telefono, direccion: form.direccion },
      },
    })
    setCargando(false)

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Este correo ya está registrado. Intenta iniciar sesión.'
          : 'No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.'
      )
      return
    }

    // Si el proyecto exige confirmar correo, no habra sesion todavia
    if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      setExito(true)
    }
  }

  if (exito) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-800">¡Cuenta creada!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Te enviamos un correo de confirmación. Revísalo y luego inicia sesión.
        </p>
        <Link href="/login" className="btn-primario mt-6">
          Ir a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-agro-100 text-agro-700">
            <UserPlus size={22} />
          </span>
          <h1 className="mt-3 text-xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">Regístrate para pedir tus sacos de alimento online.</p>
        </div>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
            <input required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono / WhatsApp</label>
            <input
              type="tel"
              required
              value={form.telefono}
              onChange={(e) => actualizar('telefono', e.target.value)}
              className="input"
              placeholder="9XXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dirección de entrega</label>
            <input
              required
              value={form.direccion}
              onChange={(e) => actualizar('direccion', e.target.value)}
              className="input"
              placeholder="Jr./Av., número, referencia"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => actualizar('email', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => actualizar('password', e.target.value)}
              className="input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={cargando} className="btn-primario w-full">
            {cargando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-agro-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

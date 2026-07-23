'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Power, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ETAPAS, etiquetaEtapa, soles } from '@/lib/utils'
import type { Categoria, Etapa, Producto } from '@/lib/types'

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  categoria_id: '',
  etapa: 'inicio' as Etapa,
  presentacion_kg: '50',
  precio: '',
  stock: '0',
}

export default function AdminProductosPage() {
  const supabase = createClient()

  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [imagen, setImagen] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargarDatos() {
    setCargando(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('categorias').select('*').order('orden'),
    ])
    setProductos((prods ?? []) as Producto[])
    setCategorias((cats ?? []) as Categoria[])
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirNuevo() {
    setEditando(null)
    setForm({ ...FORM_VACIO, categoria_id: categorias[0]?.id ?? '' })
    setImagen(null)
    setError(null)
    setModalAbierto(true)
  }

  function abrirEditar(p: Producto) {
    setEditando(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoria_id: p.categoria_id ?? '',
      etapa: p.etapa ?? 'otro',
      presentacion_kg: String(p.presentacion_kg),
      precio: String(p.precio),
      stock: String(p.stock),
    })
    setImagen(null)
    setError(null)
    setModalAbierto(true)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)

    try {
      // 1. Subir imagen nueva (si se selecciono) al bucket publico "productos"
      let imagen_url = editando?.imagen_url ?? null
      if (imagen) {
        const extension = imagen.name.split('.').pop() ?? 'jpg'
        const ruta = `${Date.now()}.${extension}`
        const { error: errorSubida } = await supabase.storage.from('productos').upload(ruta, imagen)
        if (errorSubida) throw new Error('No se pudo subir la imagen del producto.')
        const { data: publica } = supabase.storage.from('productos').getPublicUrl(ruta)
        imagen_url = publica.publicUrl
      }

      const datos = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        categoria_id: form.categoria_id || null,
        etapa: form.etapa,
        presentacion_kg: Number(form.presentacion_kg),
        precio: Number(form.precio),
        stock: Number(form.stock),
        imagen_url,
      }

      // 2. Insertar o actualizar segun corresponda
      const { error: errorDb } = editando
        ? await supabase.from('productos').update(datos).eq('id', editando.id)
        : await supabase.from('productos').insert(datos)

      if (errorDb) throw new Error(errorDb.message)

      setModalAbierto(false)
      await cargarDatos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  async function alternarActivo(p: Producto) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    await cargarDatos()
  }

  const cambiar = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <button onClick={abrirNuevo} className="btn-primario text-sm">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {cargando ? (
        <p className="mt-10 text-center text-gray-500">Cargando productos...</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="p-3">Producto</th>
                <th className="p-3">Etapa</th>
                <th className="p-3">Presentación</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map((p) => (
                <tr key={p.id} className={p.activo ? '' : 'opacity-50'}>
                  <td className="p-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="p-3 text-gray-500">{etiquetaEtapa(p.etapa)}</td>
                  <td className="p-3 text-gray-500">{Number(p.presentacion_kg)} kg</td>
                  <td className="p-3 font-semibold text-agro-700">{soles(p.precio)}</td>
                  <td className={`p-3 font-semibold ${p.stock <= 5 ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-agro-700"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => alternarActivo(p)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        aria-label={p.activo ? 'Desactivar' : 'Activar'}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardar} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input required value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => cambiar('descripcion', e.target.value)}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    required
                    value={form.categoria_id}
                    onChange={(e) => cambiar('categoria_id', e.target.value)}
                    className="input"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Etapa</label>
                  <select value={form.etapa} onChange={(e) => cambiar('etapa', e.target.value)} className="input">
                    {ETAPAS.map((e) => (
                      <option key={e.valor} value={e.valor}>
                        {e.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kg por saco</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={form.presentacion_kg}
                    onChange={(e) => cambiar('presentacion_kg', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Precio (S/)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={form.precio}
                    onChange={(e) => cambiar('precio', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => cambiar('stock', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Imagen del producto</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-500 hover:border-agro-600">
                  <Upload size={16} />
                  {imagen ? imagen.name : editando?.imagen_url ? 'Cambiar imagen actual' : 'Subir imagen (opcional)'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secundario flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn-primario flex-1">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CartItem, Producto } from '@/lib/types'

interface CartContextType {
  items: CartItem[]
  agregar: (producto: Producto, cantidad?: number) => void
  actualizarCantidad: (id: string, cantidad: number) => void
  quitar: (id: string) => void
  vaciar: () => void
  total: number
  cantidadTotal: number
  cargado: boolean
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'carrito-alimentos'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cargado, setCargado] = useState(false)

  // Cargar carrito guardado (solo en el navegador, evita errores de hidratacion)
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) setItems(JSON.parse(guardado))
    } catch {
      // JSON corrupto: empezar con carrito vacio
    }
    setCargado(true)
  }, [])

  // Persistir cada cambio
  useEffect(() => {
    if (cargado) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, cargado])

  function agregar(producto: Producto, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.id === producto.id)
      if (existente) {
        // No permitir superar el stock disponible
        const nueva = Math.min(existente.cantidad + cantidad, producto.stock)
        return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: nueva, stock: producto.stock } : i))
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          presentacion_kg: Number(producto.presentacion_kg),
          imagen_url: producto.imagen_url,
          stock: producto.stock,
          cantidad: Math.min(cantidad, producto.stock),
        },
      ]
    })
  }

  function actualizarCantidad(id: string, cantidad: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) } : i))
        .filter((i) => i.cantidad > 0)
    )
  }

  function quitar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function vaciar() {
    setItems([])
  }

  const total = useMemo(() => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [items])
  const cantidadTotal = useMemo(() => items.reduce((acc, i) => acc + i.cantidad, 0), [items])

  return (
    <CartContext.Provider value={{ items, agregar, actualizarCantidad, quitar, vaciar, total, cantidadTotal, cargado }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

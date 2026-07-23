'use client'

import { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useCart } from './CartProvider'
import type { Producto } from '@/lib/types'

interface Props {
  producto: Producto
  cantidad?: number
  className?: string
}

export default function AddToCartButton({ producto, cantidad = 1, className = '' }: Props) {
  const { agregar, items } = useCart()
  const [agregado, setAgregado] = useState(false)

  const enCarrito = items.find((i) => i.id === producto.id)?.cantidad ?? 0
  const sinStock = producto.stock <= 0 || enCarrito >= producto.stock

  function manejarClick() {
    agregar(producto, cantidad)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1200)
  }

  return (
    <button onClick={manejarClick} disabled={sinStock} className={`btn-primario ${className}`}>
      {agregado ? <Check size={18} /> : <ShoppingCart size={18} />}
      {sinStock ? 'Sin stock' : agregado ? 'Agregado' : 'Agregar al carrito'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import type { Producto } from '@/lib/types'

// Selector de cantidad con validacion contra el stock disponible
export default function ProductDetailActions({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1)

  const cambiar = (delta: number) =>
    setCantidad((c) => Math.max(1, Math.min(c + delta, Math.max(producto.stock, 1))))

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-fit items-center rounded-lg border border-gray-300">
        <button onClick={() => cambiar(-1)} className="p-2.5 text-gray-600 hover:text-agro-700" aria-label="Menos">
          <Minus size={16} />
        </button>
        <span className="w-10 text-center font-semibold">{cantidad}</span>
        <button onClick={() => cambiar(1)} className="p-2.5 text-gray-600 hover:text-agro-700" aria-label="Más">
          <Plus size={16} />
        </button>
      </div>
      <AddToCartButton producto={producto} cantidad={cantidad} className="flex-1" />
    </div>
  )
}

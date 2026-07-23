// Tipos que reflejan el esquema de la base de datos en Supabase

export type Etapa = 'inicio' | 'crecimiento' | 'acabado' | 'postura' | 'otro'
export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_reparto' | 'entregado' | 'cancelado'
export type MetodoPago = 'yape' | 'plin' | 'contra_entrega'
export type Rol = 'cliente' | 'admin'

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  orden: number
}

export interface Producto {
  id: string
  categoria_id: string | null
  nombre: string
  descripcion: string | null
  etapa: Etapa | null
  presentacion_kg: number
  precio: number
  stock: number
  imagen_url: string | null
  activo: boolean
  created_at: string
}

export interface Perfil {
  id: string
  nombre: string | null
  telefono: string | null
  direccion: string | null
  rol: Rol
}

export interface Pedido {
  id: string
  codigo: string
  usuario_id: string
  total: number
  estado: EstadoPedido
  metodo_pago: MetodoPago | null
  comprobante_url: string | null
  direccion_entrega: string | null
  telefono_contacto: string | null
  notas: string | null
  created_at: string
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

// Item del carrito (lado cliente, persistido en localStorage)
export interface CartItem {
  id: string
  nombre: string
  precio: number
  presentacion_kg: number
  imagen_url: string | null
  stock: number
  cantidad: number
}

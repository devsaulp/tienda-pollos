import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import { WEB_1 } from '@/lib/config'

export const metadata: Metadata = {
  title: `${WEB_1} | Alimentos balanceados para pollos`,
  description:
    'Venta de alimentos balanceados para pollos de engorde y gallinas de postura. Pedidos online con pago por Yape, Plin o contra entrega.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  )
}

import { MessageCircle } from 'lucide-react'
import { linkWhatsApp } from '@/lib/config'

// Boton flotante visible en todas las paginas publicas
export default function WhatsAppButton() {
  return (
    <a
      href={linkWhatsApp()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <MessageCircle size={28} />
    </a>
  )
}

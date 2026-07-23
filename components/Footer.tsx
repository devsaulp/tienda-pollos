import { Clock, MapPin, Phone } from 'lucide-react'
import { DIRECCION_LOCAL, HORARIO_ATENCION, NOMBRE_EMPRESA, NUMERO_WHATSAPP, ZONAS_REPARTO } from '@/lib/config'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 font-bold text-agro-700">{NOMBRE_EMPRESA}</h3>
          <p className="text-sm text-gray-600">
            Alimentos balanceados para pollos de engorde y gallinas de postura. Calidad que se nota en tu galpón.
          </p>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <MapPin size={16} className="text-agro-600" /> {DIRECCION_LOCAL}
          </p>
          <p className="flex items-center gap-2">
            <Phone size={16} className="text-agro-600" /> +{NUMERO_WHATSAPP}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={16} className="text-agro-600" /> {HORARIO_ATENCION}
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <h4 className="mb-2 font-semibold text-gray-800">Zonas de reparto</h4>
          <p>{ZONAS_REPARTO}</p>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {NOMBRE_EMPRESA}. Todos los derechos reservados.
      </div>
    </footer>
  )
}

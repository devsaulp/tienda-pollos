// ============================================================
// DATOS DEL NEGOCIO — reemplazar los placeholders antes de publicar
// ============================================================

export const NOMBRE_EMPRESA = 'COMERCIAL ENRRIQUE'
export const NUMERO_WHATSAPP = '51960063993' // con codigo de pais, ej: 51999999999
export const NUMERO_YAPE = '[NUMERO_YAPE]'
export const DIRECCION_LOCAL = '[DIRECCION_LOCAL]'

// CONFIGURAR: horario de atencion mostrado en el footer
export const HORARIO_ATENCION = 'Lun a Sab: 8:00 am - 6:00 pm'

// CONFIGURAR: costo de envio y zonas de reparto (decision de negocio)
export const COSTO_ENVIO = 0 // en soles; 0 = coordinar por WhatsApp
export const ZONAS_REPARTO = 'Reparto en la ciudad y alrededores. Consultar por WhatsApp para otras zonas.'

// Umbral para alertas de stock bajo en el panel admin
export const STOCK_BAJO = 5

export const MENSAJE_WHATSAPP_DEFAULT =
  'Hola, quiero información sobre sus alimentos para pollos'

export function linkWhatsApp(mensaje: string = MENSAJE_WHATSAPP_DEFAULT) {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

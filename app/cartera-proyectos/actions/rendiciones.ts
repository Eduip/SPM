'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearRendicion(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const estado_pago_id = String(formData.get('estado_pago_id') || '')
  const numero_rendicion = Number(formData.get('numero_rendicion'))
  const fecha = String(formData.get('fecha') || '')
  const monto_rendido = Number(formData.get('monto_rendido'))
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !numero_rendicion || !fecha || !monto_rendido) {
    return { success: false, error: 'Faltan campos obligatorios de la rendición.' }
  }

  const { error } = await supabase
    .from('proyecto_rendiciones')
    .insert({
      proyecto_id,
      estado_pago_id: estado_pago_id || null,
      numero_rendicion,
      fecha,
      monto_rendido,
      estado: 'pendiente_revision',
      observacion: observacion || null,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
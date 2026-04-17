'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearGarantia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const numero_documento = String(formData.get('numero_documento') || '')
  const emisor = String(formData.get('emisor') || '')
  const monto = Number(formData.get('monto'))
  const fecha_emision = String(formData.get('fecha_emision') || '')
  const fecha_vencimiento = String(formData.get('fecha_vencimiento') || '')
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !tipo || !numero_documento || !monto || !fecha_vencimiento) {
    return { success: false, error: 'Faltan campos obligatorios de la garantía.' }
  }

  const { error } = await supabase
    .from('proyecto_garantias')
    .insert({
      proyecto_id,
      tipo,
      numero_documento,
      emisor,
      monto,
      fecha_emision: fecha_emision || null,
      fecha_vencimiento,
      estado: 'vigente',
      observacion: observacion || null,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
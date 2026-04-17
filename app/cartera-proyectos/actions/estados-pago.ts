'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearEstadoPago(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const numero = Number(formData.get('numero'))
  const fecha = String(formData.get('fecha'))
  const monto = Number(formData.get('monto'))
  const avance_fisico = Number(formData.get('avance_fisico'))

  if (!proyecto_id || !numero || !fecha || !monto) {
    return { success: false, error: 'Faltan datos del estado de pago' }
  }

  const { error } = await supabase
    .from('proyecto_estados_pago')
    .insert({
      proyecto_id,
      numero,
      fecha,
      monto,
      avance_fisico,
      estado: 'pendiente',
    })

  if (error) return { success: false, error: error.message }

  return { success: true }
}
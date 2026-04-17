'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearTransferencia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = formData.get('proyecto_id') as string
  const concepto = formData.get('concepto') as string
  const fecha = formData.get('fecha') as string
  const monto = Number(formData.get('monto'))

  if (!proyecto_id || !concepto || !monto) {
    return { success: false, error: 'Faltan datos obligatorios' }
  }

  const { error } = await supabase
    .from('proyecto_transferencias')
    .insert({
      proyecto_id,
      concepto,
      fecha,
      monto,
      estado: 'registrada',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
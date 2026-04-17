'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearBitacora(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const descripcion = String(formData.get('descripcion') || '')

  if (!proyecto_id || !tipo || !descripcion) {
    return { success: false, error: 'Faltan campos en la bitácora.' }
  }

  const { data, error } = await supabase
    .from('proyecto_bitacora')
    .insert({
      proyecto_id,
      tipo,
      descripcion,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // 🔥 registrar en historial_eventos
  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyecto_id,
    accion: 'bitacora_registro',
    descripcion,
    metadata: {
      tipo,
      bitacora_id: data.id,
    },
  })

  return { success: true }
}
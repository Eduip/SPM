'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearUnidad(formData: FormData) {
  const supabase = await createClient()

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim()
  const descripcion = String(formData.get('descripcion') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre) {
    return { success: false, error: 'El nombre de la unidad es obligatorio.' }
  }

  const { error } = await supabase
    .from('unidades')
    .insert({
      nombre,
      codigo: codigo || null,
      descripcion: descripcion || null,
      activo,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function actualizarUnidad({
  id,
  nombre,
  codigo,
  descripcion,
  activo,
}: {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  activo: boolean
}) {
  const supabase = await createClient()

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar la unidad.' }
  }

  const { error } = await supabase
    .from('unidades')
    .update({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      descripcion: descripcion.trim() || null,
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
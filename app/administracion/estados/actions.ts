'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearEstadoSistema(formData: FormData) {
  const supabase = await createClient()

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const color = String(formData.get('color') || '#2563eb').trim()
  const descripcion = String(formData.get('descripcion') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre || !categoria) {
    return { success: false, error: 'Nombre y categoría son obligatorios.' }
  }

  const { error } = await supabase
    .from('estados_sistema')
    .insert({
      nombre,
      codigo: codigo || null,
      categoria,
      color: color || '#2563eb',
      descripcion: descripcion || null,
      activo,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function actualizarEstadoSistema({
  id,
  nombre,
  codigo,
  categoria,
  color,
  descripcion,
  activo,
}: {
  id: string
  nombre: string
  codigo: string
  categoria: string
  color: string
  descripcion: string
  activo: boolean
}) {
  const supabase = await createClient()

  if (!id || !nombre.trim() || !categoria.trim()) {
    return { success: false, error: 'Faltan datos para actualizar el estado.' }
  }

  const { error } = await supabase
    .from('estados_sistema')
    .update({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      categoria: categoria.trim(),
      color: color.trim() || '#2563eb',
      descripcion: descripcion.trim() || null,
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
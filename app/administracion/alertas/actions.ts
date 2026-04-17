'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearTipoAlerta(formData: FormData) {
  const supabase = await createClient()

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim()
  const modulo = String(formData.get('modulo') || '').trim()
  const severidad = String(formData.get('severidad') || '').trim()
  const color = String(formData.get('color') || '#f59e0b').trim()
  const descripcion = String(formData.get('descripcion') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre || !modulo || !severidad) {
    return { success: false, error: 'Nombre, módulo y severidad son obligatorios.' }
  }

  const { error } = await supabase
    .from('tipos_alerta')
    .insert({
      nombre,
      codigo: codigo || null,
      modulo,
      severidad,
      color: color || '#f59e0b',
      descripcion: descripcion || null,
      activo,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function actualizarTipoAlerta({
  id,
  nombre,
  codigo,
  modulo,
  severidad,
  color,
  descripcion,
  activo,
}: {
  id: string
  nombre: string
  codigo: string
  modulo: string
  severidad: string
  color: string
  descripcion: string
  activo: boolean
}) {
  const supabase = await createClient()

  if (!id || !nombre.trim() || !modulo.trim() || !severidad.trim()) {
    return { success: false, error: 'Faltan datos para actualizar el tipo de alerta.' }
  }

  const { error } = await supabase
    .from('tipos_alerta')
    .update({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      modulo: modulo.trim(),
      severidad: severidad.trim(),
      color: color.trim() || '#f59e0b',
      descripcion: descripcion.trim() || null,
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
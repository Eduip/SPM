'use server'

import { createClient } from '../../../lib/supabase-server'
import { requireAdmin } from '../../../lib/auth-guards'

export async function crearUnidad(formData: FormData) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim()
  const descripcion = String(formData.get('descripcion') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre) {
    return { success: false, error: 'El nombre de la unidad es obligatorio.' }
  }

  const existingUnidadQuery = supabase
    .from('unidades')
    .select('id, activo')

  const { data: existingUnidad, error: existingUnidadError } = codigo
    ? await existingUnidadQuery.eq('codigo', codigo).maybeSingle()
    : await existingUnidadQuery.eq('nombre', nombre).maybeSingle()

  if (existingUnidadError) {
    return { success: false, error: existingUnidadError.message }
  }

  if (existingUnidad?.activo) {
    return {
      success: false,
      error: 'Ya existe una unidad activa con esos datos.',
    }
  }

  if (existingUnidad) {
    const { error } = await supabase
      .from('unidades')
      .update({
        nombre,
        codigo: codigo || null,
        descripcion: descripcion || null,
        activo,
      })
      .eq('id', existingUnidad.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
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

export async function eliminarUnidad(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió la unidad a eliminar.' }
  }

  const { error } = await supabase
    .from('unidades')
    .update({ activo: false })
    .eq('id', id)

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
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

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

'use server'

import { createClient } from '../../../lib/supabase-server'

function generateCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join('_')
    .slice(0, 60)
}

export async function crearRol(formData: FormData) {
  const supabase = await createClient()

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim() || generateCode(nombre)
  const descripcion = String(formData.get('descripcion') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre) {
    return { success: false, error: 'El nombre del rol es obligatorio.' }
  }

  const { data: existingRol, error: existingRolError } = await supabase
    .from('roles')
    .select('id, activo')
    .eq('codigo', codigo)
    .maybeSingle()

  if (existingRolError) {
    return { success: false, error: existingRolError.message }
  }

  if (existingRol?.activo) {
    return { success: false, error: 'Ya existe un rol activo con ese código.' }
  }

  if (existingRol) {
    const { error } = await supabase
      .from('roles')
      .update({
        nombre,
        codigo,
        descripcion: descripcion || null,
        activo,
      })
      .eq('id', existingRol.id)

    if (error) return { success: false, error: error.message }

    return { success: true }
  }

  const { error } = await supabase
    .from('roles')
    .insert({
      nombre,
      codigo,
      descripcion: descripcion || null,
      activo,
    })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function eliminarRol(id: string) {
  const supabase = await createClient()

  if (!id) {
    return { success: false, error: 'No se recibió el rol a eliminar.' }
  }

  const { error } = await supabase
    .from('roles')
    .update({ activo: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function crearPermiso(formData: FormData) {
  const supabase = await createClient()

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim() || generateCode(nombre)
  const modulo = String(formData.get('modulo') || '').trim() || 'general'
  const descripcion = String(formData.get('descripcion') || '').trim()

  if (!nombre) {
    return { success: false, error: 'El nombre del permiso es obligatorio.' }
  }

  const { data: existingPermiso, error: existingPermisoError } = await supabase
    .from('permisos')
    .select('id')
    .eq('codigo', codigo)
    .maybeSingle()

  if (existingPermisoError) {
    return { success: false, error: existingPermisoError.message }
  }

  if (existingPermiso) {
    return { success: false, error: 'Ya existe un permiso con ese código.' }
  }

  const { error } = await supabase
    .from('permisos')
    .insert({
      nombre,
      codigo,
      modulo,
      descripcion: descripcion || null,
    })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function eliminarPermiso(id: string) {
  const supabase = await createClient()

  if (!id) {
    return { success: false, error: 'No se recibió el permiso a eliminar.' }
  }

  const { error: relacionesError } = await supabase
    .from('roles_permisos')
    .delete()
    .eq('permiso_id', id)

  if (relacionesError) {
    return { success: false, error: relacionesError.message }
  }

  const { error } = await supabase
    .from('permisos')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function togglePermisoRol({
  rolId,
  permisoId,
  activo,
}: {
  rolId: string
  permisoId: string
  activo: boolean
}) {
  const supabase = await createClient()

  if (activo) {
    const { error } = await supabase
      .from('roles_permisos')
      .upsert({
        rol_id: rolId,
        permiso_id: permisoId,
      }, {
        onConflict: 'rol_id,permiso_id',
        ignoreDuplicates: true,
      })

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('roles_permisos')
      .delete()
      .eq('rol_id', rolId)
      .eq('permiso_id', permisoId)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}

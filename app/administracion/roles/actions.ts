'use server'

import { createClient } from '../../../lib/supabase-server'

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
      .insert({
        rol_id: rolId,
        permiso_id: permisoId,
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
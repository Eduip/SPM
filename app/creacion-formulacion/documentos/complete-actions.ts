'use server'

import { createClient } from '../../../lib/supabase-server'

export async function marcarDocumentosCompletados(proyectoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !proyectoId) {
    return { success: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return { success: false }
  }

  const { error } = await supabase
    .from('proyectos')
    .update({
      etapa_formulacion_actual: 4,
      porcentaje_formulacion: 80,
      updated_by: profile.id,
    })
    .eq('id', proyectoId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.rpc('registrar_evento_historial', {
    p_entidad: 'proyecto',
    p_entidad_id: proyectoId,
    p_accion: 'editar',
    p_descripcion: 'Etapa de documentos completada correctamente.',
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'documentos',
      porcentaje_formulacion: 80,
    },
  })

  return { success: true }
}
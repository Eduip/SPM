'use server'

import { createClient } from '../../../lib/supabase-server'

export async function aprobarProyecto(proyectoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'No se pudo identificar al usuario autenticado.',
    }
  }

  if (!proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return {
      success: false,
      error: 'El usuario no tiene perfil asociado.',
    }
  }

  const { error: updateError } = await supabase
    .from('proyectos')
    .update({
      estado: 'aprobado',
      etapa_formulacion_actual: 5,
      porcentaje_formulacion: 100,
      updated_by: profile.id,
    })
    .eq('id', proyectoId)

  if (updateError) {
    return {
      success: false,
      error: updateError.message || 'No se pudo aprobar el proyecto.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: proyectoId,
      p_accion: 'aprobar',
      p_descripcion: 'Proyecto aprobado correctamente.',
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'aprobacion',
        estado: 'aprobado',
        porcentaje_formulacion: 100,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'El proyecto se aprobó, pero falló el registro en historial.',
    }
  }

  return {
    success: true,
  }
}
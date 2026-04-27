'use server'

import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

type SavePostulacionPayload = {
  proyectoId: string
  fuenteId: string
  puntajeDiagnostico: number
  puntajePertinencia: number
  puntajeRS: number
  puntajeTotal: number
  porcentajeEvaluacion: number
  aprobado: boolean
}

export async function savePostulacionData(payload: SavePostulacionPayload) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!access.success) {
    return access
  }

  if (!payload.proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  if (!payload.fuenteId) {
    return {
      success: false,
      error: 'Debes seleccionar una fuente de financiamiento.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', access.userId)
    .maybeSingle()

  if (!profile) {
    return {
      success: false,
      error: 'El usuario no tiene perfil asociado.',
    }
  }

  const { data: existingPostulacion } = await supabase
    .from('proyecto_postulacion')
    .select('id')
    .eq('proyecto_id', payload.proyectoId)
    .maybeSingle()

  let postulacionId = existingPostulacion?.id ?? ''

  if (postulacionId) {
    const { error: updateError } = await supabase
      .from('proyecto_postulacion')
      .update({
        puntaje_total: payload.puntajeTotal,
        porcentaje_evaluacion: payload.porcentajeEvaluacion,
        aprobado: payload.aprobado,
      })
      .eq('id', postulacionId)

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'No se pudo actualizar la postulación.',
      }
    }

    await supabase
      .from('proyecto_fuentes_financiamiento')
      .delete()
      .eq('proyecto_id', payload.proyectoId)

    await supabase
      .from('proyecto_evaluacion')
      .delete()
      .eq('proyecto_id', payload.proyectoId)
  } else {
    const { data: newPostulacion, error: insertError } = await supabase
      .from('proyecto_postulacion')
      .insert({
        proyecto_id: payload.proyectoId,
        puntaje_total: payload.puntajeTotal,
        porcentaje_evaluacion: payload.porcentajeEvaluacion,
        aprobado: payload.aprobado,
      })
      .select('id')
      .single()

    if (insertError || !newPostulacion) {
      return {
        success: false,
        error: insertError?.message || 'No se pudo crear la postulación.',
      }
    }

    postulacionId = newPostulacion.id
  }

  const { data: fuenteCatalogo, error: fuentesError } = await supabase
    .from('fuentes_financiamiento')
    .select('id, nombre')
    .eq('id', payload.fuenteId)
    .eq('activo', true)
    .maybeSingle()

  if (fuentesError || !fuenteCatalogo) {
    return {
      success: false,
      error:
        fuentesError?.message ||
        'No se pudo resolver la fuente de financiamiento seleccionada.',
    }
  }

  const { error: deleteFuentesError } = await supabase
    .from('proyecto_fuentes_financiamiento')
    .delete()
    .eq('proyecto_id', payload.proyectoId)

  if (deleteFuentesError) {
    return {
      success: false,
      error:
        deleteFuentesError.message ||
        'No se pudo actualizar la fuente de financiamiento del proyecto.',
    }
  }

  const { error: insertFuentesError } = await supabase
    .from('proyecto_fuentes_financiamiento')
    .insert({
      proyecto_id: payload.proyectoId,
      fuente_id: fuenteCatalogo.id,
    })

  if (insertFuentesError) {
    return {
      success: false,
      error:
        insertFuentesError.message ||
        'No se pudo guardar la fuente de financiamiento.',
    }
  }

  const evaluacionToInsert = [
    {
      proyecto_id: payload.proyectoId,
      criterio: 'diagnostico',
      puntaje: payload.puntajeDiagnostico,
      puntaje_max: 5,
    },
    {
      proyecto_id: payload.proyectoId,
      criterio: 'pertinencia',
      puntaje: payload.puntajePertinencia,
      puntaje_max: 15,
    },
    {
      proyecto_id: payload.proyectoId,
      criterio: 'rentabilidad_social',
      puntaje: payload.puntajeRS,
      puntaje_max: 15,
    },
  ]

  const { error: evaluacionError } = await supabase
    .from('proyecto_evaluacion')
    .insert(evaluacionToInsert)

  if (evaluacionError) {
    return {
      success: false,
      error: evaluacionError.message || 'No se pudo guardar la evaluación.',
    }
  }

  const { error: updateProyectoError } = await supabase
    .from('proyectos')
    .update({
      fuente_financiamiento_id: fuenteCatalogo.id,
      etapa_formulacion_actual: 3,
      porcentaje_formulacion: 60,
      updated_by: profile.id,
    })
    .eq('id', payload.proyectoId)

  if (updateProyectoError) {
    return {
      success: false,
      error:
        updateProyectoError.message ||
        'La postulación se guardó, pero no se pudo actualizar el proyecto.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: payload.proyectoId,
      p_accion: 'editar',
      p_descripcion: 'Postulación guardada/actualizada correctamente.',
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'postulacion',
        postulacion_id: postulacionId,
        fuente_id: fuenteCatalogo.id,
        fuente_nombre: fuenteCatalogo.nombre,
        puntaje_total: payload.puntajeTotal,
        porcentaje_evaluacion: payload.porcentajeEvaluacion,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'La postulación se guardó, pero falló el registro en historial.',
    }
  }

  return {
    success: true,
    postulacionId,
  }
}

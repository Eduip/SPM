'use server'

import { createClient } from '../../../lib/supabase-server'

type SavePostulacionPayload = {
  proyectoId: string
  tipoProyecto: string
  nombreProyecto: string
  montoTotal: string
  unidadResponsable: string
  utmX: string
  utmY: string
  periodo: string
  fuentes: string[]
  puntajeDiagnostico: number
  puntajePertinencia: number
  puntajeRS: number
  puntajeTotal: number
  porcentajeEvaluacion: number
  aprobado: boolean
}

export async function savePostulacionData(payload: SavePostulacionPayload) {
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

  if (!payload.proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  const requiredFields = [
    { value: payload.tipoProyecto, label: 'Tipo de Proyecto' },
    { value: payload.nombreProyecto, label: 'Nombre del Proyecto' },
    { value: payload.montoTotal, label: 'Monto Total del Proyecto' },
    { value: payload.unidadResponsable, label: 'Unidad Responsable' },
    { value: payload.periodo, label: 'Periodo del Proyecto' },
  ]

  for (const field of requiredFields) {
    if (!field.value || String(field.value).trim() === '') {
      return {
        success: false,
        error: `El campo "${field.label}" es obligatorio.`,
      }
    }
  }

  if (!payload.fuentes.length) {
    return {
      success: false,
      error: 'Debes seleccionar al menos una fuente de financiamiento.',
    }
  }

  const montoNormalizado = Number(
    String(payload.montoTotal)
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/[^\d.]/g, '')
  )

  if (Number.isNaN(montoNormalizado) || montoNormalizado < 0) {
    return {
      success: false,
      error: 'El monto total no es válido.',
    }
  }

  const utmX = payload.utmX ? Number(String(payload.utmX).replace(',', '.')) : null
  const utmY = payload.utmY ? Number(String(payload.utmY).replace(',', '.')) : null

  if (payload.utmX && Number.isNaN(utmX)) {
    return {
      success: false,
      error: 'La coordenada UTM X no es válida.',
    }
  }

  if (payload.utmY && Number.isNaN(utmY)) {
    return {
      success: false,
      error: 'La coordenada UTM Y no es válida.',
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
        tipo_proyecto_texto: payload.tipoProyecto,
        nombre_proyecto: payload.nombreProyecto,
        monto_total: montoNormalizado,
        unidad_responsable_texto: payload.unidadResponsable,
        utm_x: utmX,
        utm_y: utmY,
        periodo: payload.periodo,
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
        tipo_proyecto_texto: payload.tipoProyecto,
        nombre_proyecto: payload.nombreProyecto,
        monto_total: montoNormalizado,
        unidad_responsable_texto: payload.unidadResponsable,
        utm_x: utmX,
        utm_y: utmY,
        periodo: payload.periodo,
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

  const { data: fuentesCatalogo, error: fuentesError } = await supabase
    .from('fuentes_financiamiento')
    .select('id, nombre')
    .in('nombre', payload.fuentes)

  if (fuentesError) {
    return {
      success: false,
      error: fuentesError.message || 'No se pudieron resolver las fuentes.',
    }
  }

  const fuentesToInsert =
    fuentesCatalogo?.map((fuente) => ({
      proyecto_id: payload.proyectoId,
      fuente_id: fuente.id,
    })) ?? []

  if (fuentesToInsert.length) {
    const { error: insertFuentesError } = await supabase
      .from('proyecto_fuentes_financiamiento')
      .insert(fuentesToInsert)

    if (insertFuentesError) {
      return {
        success: false,
        error:
          insertFuentesError.message ||
          'No se pudieron guardar las fuentes de financiamiento.',
      }
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
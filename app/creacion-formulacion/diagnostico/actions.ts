'use server'

import { createClient } from '../../../lib/supabase-server'

type DiagnosticoItemPayload = {
  id: string
  title: string
  description: string
}

type SaveDiagnosticoPayload = {
  proyectoId: string
  problemaCentral: string
  justificacion: string
  causas: DiagnosticoItemPayload[]
  consecuencias: DiagnosticoItemPayload[]
}

export async function saveDiagnosticoData(payload: SaveDiagnosticoPayload) {
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

  if (!payload.problemaCentral.trim()) {
    return {
      success: false,
      error: 'El problema central es obligatorio.',
    }
  }

  if (!payload.justificacion.trim()) {
    return {
      success: false,
      error: 'La justificación del proyecto es obligatoria.',
    }
  }

  const causasValidas = payload.causas.filter(
    (item) => item.title.trim() !== '' || item.description.trim() !== ''
  )

  const consecuenciasValidas = payload.consecuencias.filter(
    (item) => item.title.trim() !== '' || item.description.trim() !== ''
  )

  if (causasValidas.length === 0) {
    return {
      success: false,
      error: 'Debes ingresar al menos una causa.',
    }
  }

  if (consecuenciasValidas.length === 0) {
    return {
      success: false,
      error: 'Debes ingresar al menos una consecuencia.',
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

  const { data: existingDiagnostico } = await supabase
    .from('proyecto_diagnostico')
    .select('id')
    .eq('proyecto_id', payload.proyectoId)
    .maybeSingle()

  let diagnosticoId = existingDiagnostico?.id ?? ''

  if (diagnosticoId) {
    const { error: updateDiagnosticoError } = await supabase
      .from('proyecto_diagnostico')
      .update({
        problema_central: payload.problemaCentral,
        justificacion: payload.justificacion,
      })
      .eq('id', diagnosticoId)

    if (updateDiagnosticoError) {
      return {
        success: false,
        error:
          updateDiagnosticoError.message ||
          'No se pudo actualizar el diagnóstico.',
      }
    }

    await supabase.from('diagnostico_causas').delete().eq('diagnostico_id', diagnosticoId)
    await supabase
      .from('diagnostico_consecuencias')
      .delete()
      .eq('diagnostico_id', diagnosticoId)
  } else {
    const { data: nuevoDiagnostico, error: insertDiagnosticoError } = await supabase
      .from('proyecto_diagnostico')
      .insert({
        proyecto_id: payload.proyectoId,
        problema_central: payload.problemaCentral,
        justificacion: payload.justificacion,
      })
      .select('id')
      .single()

    if (insertDiagnosticoError || !nuevoDiagnostico) {
      return {
        success: false,
        error:
          insertDiagnosticoError?.message ||
          'No se pudo crear el diagnóstico.',
      }
    }

    diagnosticoId = nuevoDiagnostico.id
  }

  const causasToInsert = causasValidas.map((item) => ({
    diagnostico_id: diagnosticoId,
    titulo: item.title,
    descripcion: item.description,
  }))

  const consecuenciasToInsert = consecuenciasValidas.map((item) => ({
    diagnostico_id: diagnosticoId,
    titulo: item.title,
    descripcion: item.description,
  }))

  const { error: causasError } = await supabase
    .from('diagnostico_causas')
    .insert(causasToInsert)

  if (causasError) {
    return {
      success: false,
      error: causasError.message || 'No se pudieron guardar las causas.',
    }
  }

  const { error: consecuenciasError } = await supabase
    .from('diagnostico_consecuencias')
    .insert(consecuenciasToInsert)

  if (consecuenciasError) {
    return {
      success: false,
      error:
        consecuenciasError.message ||
        'No se pudieron guardar las consecuencias.',
    }
  }

  const { error: updateProyectoError } = await supabase
    .from('proyectos')
    .update({
      etapa_formulacion_actual: 2,
      porcentaje_formulacion: 40,
      updated_by: profile.id,
    })
    .eq('id', payload.proyectoId)

  if (updateProyectoError) {
    return {
      success: false,
      error:
        updateProyectoError.message ||
        'Se guardó el diagnóstico, pero no se pudo actualizar el proyecto.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: payload.proyectoId,
      p_accion: 'editar',
      p_descripcion: 'Diagnóstico guardado/actualizado correctamente.',
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'diagnostico',
        diagnostico_id: diagnosticoId,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'El diagnóstico se guardó, pero falló el registro en historial.',
    }
  }

  return {
    success: true,
    diagnosticoId,
  }
}
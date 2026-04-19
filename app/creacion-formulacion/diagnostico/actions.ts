'use server'

import { revalidatePath } from 'next/cache'
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
    .order('updated_at', { ascending: false })
    .limit(1)

  let diagnosticoId = existingDiagnostico?.[0]?.id ?? ''

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

  revalidatePath('/creacion-formulacion/diagnostico')
  revalidatePath('/creacion-formulacion/postulacion')

  return {
    success: true,
    diagnosticoId,
  }
}

export async function uploadDiagnosticoDocumento(formData: FormData) {
  const supabase = await createClient()

  const proyectoId = String(formData.get('proyectoId') || '')
  const file = formData.get('file') as File | null

  if (!proyectoId) {
    return { success: false, error: 'Falta el proyectoId.' }
  }

  if (!file) {
    return { success: false, error: 'Debes seleccionar un archivo.' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre_completo')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return { success: false, error: 'El usuario no tiene perfil asociado.' }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/diagnostico/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message || 'No se pudo subir el archivo al storage.',
    }
  }

  const fechaSubida = new Date().toISOString()
  const documentPayload = {
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: 'Respaldo diagnóstico',
    etapa: 'diagnostico',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: file.size,
    mime_type: file.type,
    subido_por: profile.id,
    fecha_subida: fechaSubida,
    obligatorio: false,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: null,
  }

  const { data: savedDocument, error: saveError } = await supabase
    .from('documentos_proyecto')
    .insert(documentPayload)
    .select('id')
    .single()

  if (saveError || !savedDocument) {
    return {
      success: false,
      error:
        saveError?.message ||
        'No se pudo registrar el documento en la base de datos.',
    }
  }

  const documento = {
    id: savedDocument.id,
    ...documentPayload,
    profile: [{ nombre_completo: profile.nombre_completo ?? 'Usuario' }],
  }

  await supabase.rpc('registrar_evento_historial', {
    p_entidad: 'documento',
    p_entidad_id: proyectoId,
    p_accion: 'subir_documento',
    p_descripcion: `Se cargó el respaldo de diagnóstico: ${file.name}`,
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'diagnostico',
      nombre_archivo: file.name,
    },
  })

  revalidatePath('/creacion-formulacion/diagnostico')

  return { success: true, documento }
}

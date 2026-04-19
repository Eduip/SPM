'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'

const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024

export async function uploadDocumentoProyecto(formData: FormData) {
  const supabase = await createClient()

  const proyectoId = String(formData.get('proyectoId') || '')
  const catalogoId = String(formData.get('catalogoId') || '')
  const nombre = String(formData.get('nombre') || '')
  const tipoDocumento = String(formData.get('tipoDocumento') || '')
  const obligatorio = String(formData.get('obligatorio') || 'false') === 'true'
  const file = formData.get('file') as File | null

  if (!proyectoId) {
    return { success: false, error: 'Falta el proyectoId.' }
  }

  if (!catalogoId) {
    return { success: false, error: 'Falta el documento requerido.' }
  }

  if (!file) {
    return { success: false, error: 'Debes seleccionar un archivo.' }
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      success: false,
      error: 'El archivo supera el máximo permitido de 25 MB.',
    }
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
  const path = `${proyectoId}/documentos/${Date.now()}-${safeFileName}`

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
  const documentRequirementRef = `documento_fuente_id:${catalogoId}`
  const documentPayload = {
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: tipoDocumento,
    etapa: 'documentos',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: file.size,
    mime_type: file.type,
    subido_por: profile.id,
    fecha_subida: fechaSubida,
    obligatorio,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: documentRequirementRef,
  }

  const { data: existingDocument } = await supabase
    .from('documentos_proyecto')
    .select('id')
    .eq('proyecto_id', proyectoId)
    .eq('observacion', documentRequirementRef)
    .eq('etapa', 'documentos')
    .order('fecha_subida', { ascending: false })
    .limit(1)
    .maybeSingle()

  const mutation = existingDocument?.id
    ? supabase
        .from('documentos_proyecto')
        .update(documentPayload)
        .eq('id', existingDocument.id)
        .select('id')
        .single()
    : supabase
        .from('documentos_proyecto')
        .insert(documentPayload)
        .select('id')
        .single()

  const { data: savedDocument, error: saveError } = await mutation

  if (saveError) {
    return {
      success: false,
      error: saveError.message || 'No se pudo registrar el documento en la base de datos.',
    }
  }

  if (!savedDocument) {
    return {
      success: false,
      error: 'No se pudo obtener el documento guardado.',
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
    p_descripcion: `Se cargó el documento: ${nombre}`,
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'documentos',
      nombre_archivo: file.name,
      documento_fuente_id: catalogoId,
    },
  })

  revalidatePath('/creacion-formulacion/documentos')

  return { success: true, documento }
}

export async function eliminarDocumentoProyecto(documentoId: string) {
  const supabase = await createClient()

  if (!documentoId) {
    return { success: false, error: 'No se recibió el documento a eliminar.' }
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
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return { success: false, error: 'El usuario no tiene perfil asociado.' }
  }

  const { data: documento, error: documentoError } = await supabase
    .from('documentos_proyecto')
    .select('id, proyecto_id, nombre, nombre_archivo, ruta_storage, bucket, etapa')
    .eq('id', documentoId)
    .maybeSingle()

  if (documentoError || !documento) {
    return {
      success: false,
      error: documentoError?.message || 'No se encontró el documento a eliminar.',
    }
  }

  if (documento.etapa !== 'documentos') {
    return {
      success: false,
      error: 'Solo se pueden eliminar documentos cargados en la etapa Documentos.',
    }
  }

  const { error: deleteError } = await supabase
    .from('documentos_proyecto')
    .delete()
    .eq('id', documento.id)

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message || 'No se pudo eliminar el registro del documento.',
    }
  }

  if (documento.bucket && documento.ruta_storage) {
    await supabase.storage.from(documento.bucket).remove([documento.ruta_storage])
  }

  await supabase.rpc('registrar_evento_historial', {
    p_entidad: 'documento',
    p_entidad_id: documento.proyecto_id,
    p_accion: 'eliminar_documento',
    p_descripcion: `Se eliminó el documento: ${documento.nombre || documento.nombre_archivo}`,
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'documentos',
      documento_id: documento.id,
      nombre_archivo: documento.nombre_archivo,
    },
  })

  revalidatePath('/creacion-formulacion/documentos')
  revalidatePath('/creacion-formulacion/aprobacion')

  return { success: true, documentoId: documento.id }
}

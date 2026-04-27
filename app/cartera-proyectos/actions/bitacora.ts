'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

export async function crearBitacora(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.bitacoraEdit)

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const descripcion = String(formData.get('descripcion') || '')
  const documentoNombre = String(formData.get('documento_nombre') || '').trim()
  const documentoArchivo = formData.get('documento_archivo') as File | null

  if (!proyecto_id || !tipo || !descripcion) {
    return { success: false, error: 'Faltan campos en la bitácora.' }
  }

  if (!authGuard.success) {
    return authGuard
  }

  const { data, error } = await supabase
    .from('proyecto_bitacora')
    .insert({
      proyecto_id,
      usuario_id: authGuard.userId,
      tipo,
      descripcion,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  if (documentoArchivo && documentoArchivo.size > 0) {
    const safeFileName = documentoArchivo.name.replace(/\s+/g, '-')
    const path = `${proyecto_id}/bitacora/${data.id}/${Date.now()}-${safeFileName}`
    const buffer = Buffer.from(await documentoArchivo.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('documentos-proyectos')
      .upload(path, buffer, {
        contentType: documentoArchivo.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || 'No se pudo subir el documento.',
      }
    }

    const { error: insertError } = await supabase.from('documentos_proyecto').insert({
      proyecto_id,
      catalogo_documento_id: null,
      nombre: documentoNombre || documentoArchivo.name,
      nombre_archivo: documentoArchivo.name,
      ruta_storage: path,
      bucket: 'documentos-proyectos',
      tipo_documento: documentoNombre || 'Documento bitácora',
      etapa: 'bitacora',
      extension: documentoArchivo.name.split('.').pop() || null,
      tamano_bytes: documentoArchivo.size,
      mime_type: documentoArchivo.type || null,
      subido_por: authGuard.userId,
      fecha_subida: new Date().toISOString(),
      obligatorio: false,
      estado_revision: 'subido',
      porcentaje_validacion: 100,
      observacion: `bitacora_id:${data.id}`,
    })

    if (insertError) {
      return {
        success: false,
        error: insertError.message || 'No se pudo registrar el documento.',
      }
    }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyecto_id,
    accion: 'bitacora_registro',
    descripcion,
    usuario_id: authGuard.userId,
    metadata: {
      tipo,
      bitacora_id: data.id,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarBitacora(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.bitacoraEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const bitacora_id = String(formData.get('bitacora_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const descripcion = String(formData.get('descripcion') || '')

  if (!proyecto_id || !bitacora_id || !tipo || !descripcion) {
    return { success: false, error: 'Faltan campos en la bitácora.' }
  }

  const { error } = await supabase
    .from('proyecto_bitacora')
    .update({ tipo, descripcion })
    .eq('id', bitacora_id)
    .eq('proyecto_id', proyecto_id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function eliminarBitacora(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.bitacoraEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const bitacora_id = String(formData.get('bitacora_id') || '')

  if (!proyecto_id || !bitacora_id) {
    return { success: false, error: 'No se recibió la entrada de bitácora.' }
  }

  const { data: documentos, error: documentosError } = await supabase
    .from('documentos_proyecto')
    .select('id, bucket, ruta_storage')
    .eq('proyecto_id', proyecto_id)
    .eq('etapa', 'bitacora')
    .eq('observacion', `bitacora_id:${bitacora_id}`)

  if (documentosError) return { success: false, error: documentosError.message }

  for (const documento of documentos ?? []) {
    if (documento.bucket && documento.ruta_storage) {
      await supabase.storage.from(documento.bucket).remove([documento.ruta_storage])
    }
  }

  const documentoIds = (documentos ?? []).map((documento) => documento.id)
  if (documentoIds.length > 0) {
    const { error: deleteDocsError } = await supabase
      .from('documentos_proyecto')
      .delete()
      .in('id', documentoIds)

    if (deleteDocsError) return { success: false, error: deleteDocsError.message }
  }

  const { error } = await supabase
    .from('proyecto_bitacora')
    .delete()
    .eq('id', bitacora_id)
    .eq('proyecto_id', proyecto_id)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function obtenerUrlDocumentoBitacora({
  bucket,
  rutaStorage,
  nombreArchivo,
  descargar = false,
}: {
  bucket?: string | null
  rutaStorage?: string | null
  nombreArchivo?: string | null
  descargar?: boolean
}) {
  const supabase = await createClient()

  if (!bucket || !rutaStorage) {
    return { success: false, error: 'No se encontró la ruta del documento.' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(
      rutaStorage,
      300,
      descargar ? { download: nombreArchivo || true } : undefined
    )

  if (error || !data?.signedUrl) {
    return {
      success: false,
      error: error?.message || 'No se pudo generar el enlace del documento.',
    }
  }

  return { success: true, url: data.signedUrl }
}

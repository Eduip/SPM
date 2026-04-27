'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

const ESTADOS_RENDICION = ['en_revision', 'observada', 'rendido']

export async function crearRendicion(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.rendicionesEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const estado_pago_id = String(formData.get('estado_pago_id') || '')
  const numero_rendicion = Number(formData.get('numero_rendicion'))
  const fecha = String(formData.get('fecha') || '')
  const monto_rendido = Number(formData.get('monto_rendido'))
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !numero_rendicion || !fecha || !monto_rendido) {
    return { success: false, error: 'Faltan campos obligatorios de la rendición.' }
  }

  const { error } = await supabase
    .from('proyecto_rendiciones')
    .insert({
      proyecto_id,
      estado_pago_id: estado_pago_id || null,
      numero_rendicion,
      fecha,
      monto_rendido,
      estado: 'en_revision',
      observacion: observacion || null,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarRendicion(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.rendicionesEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const rendicion_id = String(formData.get('rendicion_id') || '')
  const estado_pago_id = String(formData.get('estado_pago_id') || '')
  const numero_rendicion = Number(formData.get('numero_rendicion'))
  const fecha = String(formData.get('fecha') || '')
  const monto_rendido = Number(formData.get('monto_rendido'))
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !rendicion_id || !numero_rendicion || !fecha || !monto_rendido) {
    return { success: false, error: 'Faltan campos obligatorios de la rendición.' }
  }

  const { error } = await supabase
    .from('proyecto_rendiciones')
    .update({
      estado_pago_id: estado_pago_id || null,
      numero_rendicion,
      fecha,
      monto_rendido,
      observacion: observacion || null,
    })
    .eq('id', rendicion_id)
    .eq('proyecto_id', proyecto_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarEstadoRendicion(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.rendicionesEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const rendicion_id = String(formData.get('rendicion_id') || '')
  const estado = String(formData.get('estado') || '')

  if (!proyecto_id || !rendicion_id) {
    return { success: false, error: 'No se recibió la rendición.' }
  }

  if (!ESTADOS_RENDICION.includes(estado)) {
    return { success: false, error: 'Selecciona un estado válido.' }
  }

  const { error } = await supabase
    .from('proyecto_rendiciones')
    .update({ estado })
    .eq('id', rendicion_id)
    .eq('proyecto_id', proyecto_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function eliminarRendicion(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.rendicionesEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const rendicion_id = String(formData.get('rendicion_id') || '')

  if (!proyecto_id || !rendicion_id) {
    return { success: false, error: 'No se recibió la rendición.' }
  }

  const { data: documentos, error: documentosError } = await supabase
    .from('documentos_proyecto')
    .select('id, bucket, ruta_storage')
    .eq('proyecto_id', proyecto_id)
    .eq('etapa', 'rendicion')
    .eq('observacion', `rendicion_id:${rendicion_id}`)

  if (documentosError) {
    return { success: false, error: documentosError.message }
  }

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

    if (deleteDocsError) {
      return { success: false, error: deleteDocsError.message }
    }
  }

  const { error } = await supabase
    .from('proyecto_rendiciones')
    .delete()
    .eq('id', rendicion_id)
    .eq('proyecto_id', proyecto_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function adjuntarDocumentosRendicion(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.rendicionesEdit)

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const rendicion_id = String(formData.get('rendicion_id') || '')
  const nombres = formData.getAll('documento_nombre').map((nombre) => String(nombre || '').trim())
  const archivos = formData.getAll('documento_archivo') as File[]

  if (!proyecto_id || !rendicion_id) {
    return { success: false, error: 'No se recibió la rendición.' }
  }

  const documentosValidos = archivos
    .map((archivo, index) => ({
      archivo,
      nombre: nombres[index] || archivo.name,
    }))
    .filter(({ archivo }) => archivo && archivo.size > 0)

  if (documentosValidos.length === 0) {
    return { success: false, error: 'Adjunta al menos un documento.' }
  }

  if (!authGuard.success) {
    return authGuard
  }

  for (const { archivo, nombre } of documentosValidos) {
    const safeFileName = archivo.name.replace(/\s+/g, '-')
    const path = `${proyecto_id}/rendicion/${rendicion_id}/${Date.now()}-${safeFileName}`
    const buffer = Buffer.from(await archivo.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('documentos-proyectos')
      .upload(path, buffer, {
        contentType: archivo.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || `No se pudo subir ${archivo.name}.`,
      }
    }

    const { error: insertError } = await supabase.from('documentos_proyecto').insert({
      proyecto_id,
      catalogo_documento_id: null,
      nombre,
      nombre_archivo: archivo.name,
      ruta_storage: path,
      bucket: 'documentos-proyectos',
      tipo_documento: nombre,
      etapa: 'rendicion',
      extension: archivo.name.split('.').pop() || null,
      tamano_bytes: archivo.size,
      mime_type: archivo.type || null,
      subido_por: authGuard.userId,
      fecha_subida: new Date().toISOString(),
      obligatorio: false,
      estado_revision: 'subido',
      porcentaje_validacion: 100,
      observacion: `rendicion_id:${rendicion_id}`,
    })

    if (insertError) {
      return {
        success: false,
        error: insertError.message || `No se pudo registrar ${archivo.name}.`,
      }
    }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function obtenerUrlDocumentoRendicion({
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

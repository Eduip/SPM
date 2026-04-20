'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'

export async function crearGarantia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const numero_documento = String(formData.get('numero_documento') || '')
  const emisor = String(formData.get('emisor') || '')
  const monto = Number(formData.get('monto'))
  const fecha_emision = String(formData.get('fecha_emision') || '')
  const fecha_vencimiento = String(formData.get('fecha_vencimiento') || '')
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !tipo || !numero_documento || !monto || !fecha_vencimiento) {
    return { success: false, error: 'Faltan campos obligatorios de la garantía.' }
  }

  const { error } = await supabase
    .from('proyecto_garantias')
    .insert({
      proyecto_id,
      tipo,
      numero_documento,
      emisor,
      monto,
      fecha_emision: fecha_emision || null,
      fecha_vencimiento,
      estado: getEstadoGarantia(fecha_vencimiento),
      observacion: observacion || null,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarGarantia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const garantia_id = String(formData.get('garantia_id') || '')
  const tipo = String(formData.get('tipo') || '')
  const numero_documento = String(formData.get('numero_documento') || '')
  const emisor = String(formData.get('emisor') || '')
  const monto = Number(formData.get('monto'))
  const fecha_emision = String(formData.get('fecha_emision') || '')
  const fecha_vencimiento = String(formData.get('fecha_vencimiento') || '')
  const observacion = String(formData.get('observacion') || '')

  if (!proyecto_id || !garantia_id || !tipo || !numero_documento || !monto || !fecha_vencimiento) {
    return { success: false, error: 'Faltan campos obligatorios de la garantía.' }
  }

  const { error } = await supabase
    .from('proyecto_garantias')
    .update({
      tipo,
      numero_documento,
      emisor,
      monto,
      fecha_emision: fecha_emision || null,
      fecha_vencimiento,
      estado: getEstadoGarantia(fecha_vencimiento),
      observacion: observacion || null,
    })
    .eq('id', garantia_id)
    .eq('proyecto_id', proyecto_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function eliminarGarantia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const garantia_id = String(formData.get('garantia_id') || '')

  if (!proyecto_id || !garantia_id) {
    return { success: false, error: 'No se recibió la garantía.' }
  }

  const { data: documentos, error: documentosError } = await supabase
    .from('documentos_proyecto')
    .select('id, bucket, ruta_storage')
    .eq('proyecto_id', proyecto_id)
    .eq('etapa', 'garantias')
    .eq('observacion', `garantia_id:${garantia_id}`)

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
    .from('proyecto_garantias')
    .delete()
    .eq('id', garantia_id)
    .eq('proyecto_id', proyecto_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function adjuntarDocumentoGarantia(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const garantia_id = String(formData.get('garantia_id') || '')
  const nombre = String(formData.get('documento_nombre') || '').trim()
  const archivo = formData.get('documento_archivo') as File | null

  if (!proyecto_id || !garantia_id) {
    return { success: false, error: 'No se recibió la garantía.' }
  }

  if (!nombre || !archivo || archivo.size === 0) {
    return { success: false, error: 'Completa el nombre y adjunta un documento.' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  const safeFileName = archivo.name.replace(/\s+/g, '-')
  const path = `${proyecto_id}/garantias/${garantia_id}/${Date.now()}-${safeFileName}`
  const buffer = Buffer.from(await archivo.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: archivo.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return { success: false, error: uploadError.message || 'No se pudo subir el documento.' }
  }

  const { error: insertError } = await supabase.from('documentos_proyecto').insert({
    proyecto_id,
    catalogo_documento_id: null,
    nombre,
    nombre_archivo: archivo.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: nombre,
    etapa: 'garantias',
    extension: archivo.name.split('.').pop() || null,
    tamano_bytes: archivo.size,
    mime_type: archivo.type || null,
    subido_por: user.id,
    fecha_subida: new Date().toISOString(),
    obligatorio: false,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: `garantia_id:${garantia_id}`,
  })

  if (insertError) {
    return { success: false, error: insertError.message || 'No se pudo registrar el documento.' }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function obtenerUrlDocumentoGarantia({
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

function getEstadoGarantia(fecha?: string | null) {
  const dias = diasParaVencer(fecha)

  if (dias < 0) return 'vencido'
  if (dias < 30) return 'por_vencer'
  return 'vigente'
}

function diasParaVencer(fecha?: string | null) {
  if (!fecha) return 9999

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [year, month, day] = fecha.split('-').map(Number)
  const vencimiento = new Date(year, month - 1, day)
  const diff = vencimiento.getTime() - hoy.getTime()

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

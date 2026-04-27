'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

async function subirCartolaTransferencia({
  supabase,
  proyectoId,
  transferenciaId,
  file,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  proyectoId: string
  transferenciaId: string
  file: File | null
  userId: string
}) {
  if (!file || file.size === 0) return null

  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/financiamiento/transferencias/${transferenciaId}/${Date.now()}-${safeFileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message || 'No se pudo subir la cartola.')
  }

  const { error: insertError } = await supabase.from('documentos_proyecto').insert({
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: 'Cartola transferencia',
    etapa: 'financiamiento',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: file.size,
    mime_type: file.type || null,
    subido_por: userId,
    fecha_subida: new Date().toISOString(),
    obligatorio: false,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: `transferencia_id:${transferenciaId}`,
  })

  if (insertError) {
    throw new Error(insertError.message || 'No se pudo registrar la cartola.')
  }

  return {
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
  }
}

export async function crearTransferencia(formData: FormData) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.financiamientoEdit)

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const concepto = String(formData.get('concepto') || '').trim()
  const fecha = String(formData.get('fecha') || '')
  const monto = Number(formData.get('monto'))
  const cartola = formData.get('cartola') as File | null

  if (!proyecto_id || !concepto || !monto) {
    return { success: false, error: 'Faltan datos obligatorios' }
  }

  if (!access.success) {
    return access
  }

  const { data, error } = await supabase
    .from('proyecto_transferencias')
    .insert({
      proyecto_id,
      concepto,
      fecha,
      monto,
      estado: 'registrada',
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    await subirCartolaTransferencia({
      supabase,
      proyectoId: proyecto_id,
      transferenciaId: data.id,
      file: cartola,
      userId: access.userId,
    })
  } catch (uploadError) {
    return {
      success: false,
      error:
        uploadError instanceof Error
          ? uploadError.message
          : 'No se pudo registrar la cartola.',
    }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyecto_id,
    accion: 'registrar_transferencia',
    descripcion: `Transferencia registrada por ${concepto}.`,
    usuario_id: access.userId,
    metadata: {
      transferencia_id: data.id,
      fecha,
      monto,
      concepto,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarTransferencia(formData: FormData) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.financiamientoEdit)

  const proyectoId = String(formData.get('proyecto_id') || '')
  const transferenciaId = String(formData.get('transferencia_id') || '')
  const concepto = String(formData.get('concepto') || '').trim()
  const fecha = String(formData.get('fecha') || '')
  const monto = Number(formData.get('monto'))
  const cartola = formData.get('cartola') as File | null

  if (!proyectoId || !transferenciaId || !concepto || !monto) {
    return { success: false, error: 'Faltan datos obligatorios' }
  }

  if (!access.success) {
    return access
  }

  const { error } = await supabase
    .from('proyecto_transferencias')
    .update({
      concepto,
      fecha,
      monto,
    })
    .eq('id', transferenciaId)
    .eq('proyecto_id', proyectoId)

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    await subirCartolaTransferencia({
      supabase,
      proyectoId,
      transferenciaId,
      file: cartola,
      userId: access.userId,
    })
  } catch (uploadError) {
    return {
      success: false,
      error:
        uploadError instanceof Error
          ? uploadError.message
          : 'No se pudo registrar la cartola.',
    }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'actualizar_transferencia',
    descripcion: `Transferencia actualizada por ${concepto}.`,
    usuario_id: access.userId,
    metadata: {
      transferencia_id: transferenciaId,
      fecha,
      monto,
      concepto,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

export async function eliminarTransferencia(formData: FormData) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.financiamientoEdit)

  const proyectoId = String(formData.get('proyecto_id') || '')
  const transferenciaId = String(formData.get('transferencia_id') || '')

  if (!proyectoId || !transferenciaId) {
    return { success: false, error: 'No se recibió la transferencia.' }
  }

  if (!access.success) {
    return access
  }

  const { data: documentos, error: documentosError } = await supabase
    .from('documentos_proyecto')
    .select('id, bucket, ruta_storage')
    .eq('proyecto_id', proyectoId)
    .eq('etapa', 'financiamiento')
    .eq('observacion', `transferencia_id:${transferenciaId}`)

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
    .from('proyecto_transferencias')
    .delete()
    .eq('id', transferenciaId)
    .eq('proyecto_id', proyectoId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'eliminar_transferencia',
    descripcion: 'Transferencia eliminada.',
    usuario_id: access.userId,
    metadata: {
      transferencia_id: transferenciaId,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

export async function obtenerUrlDocumentoTransferencia({
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

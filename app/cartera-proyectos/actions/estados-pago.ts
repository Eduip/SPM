'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

type EstadoPagoDocumentoMeta = {
  id?: string
  nombre?: string | null
  nombre_archivo?: string | null
  ruta_storage?: string
  bucket?: string
  mime_type?: string | null
  tamano_bytes?: number
  fecha_subida?: string
}

async function uploadDocumento({
  supabase,
  proyectoId,
  estadoPagoId,
  file,
  tipo,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  proyectoId: string
  estadoPagoId: string
  file: File | null
  tipo: string
}) {
  if (!file || file.size === 0) return null

  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/ejecucion/estados-pago/${estadoPagoId}/${Date.now()}-${tipo}-${safeFileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    throw new Error(error.message || 'No se pudo subir el documento.')
  }

  return {
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    mime_type: file.type || null,
    tamano_bytes: file.size,
    fecha_subida: new Date().toISOString(),
  }
}

export async function crearEstadoPago(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.ejecucionEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const numero = Number(formData.get('numero'))
  const fecha = String(formData.get('fecha'))
  const monto = Number(formData.get('monto'))
  const avance_fisico = Number(formData.get('avance_fisico'))
  const documentosRequeridosRaw = String(formData.get('documentos_requeridos') || '[]')

  let documentosRequeridos: Array<{
    id: string
    nombre: string
    obligatorio: boolean
  }> = []

  try {
    const parsed = JSON.parse(documentosRequeridosRaw)
    documentosRequeridos = Array.isArray(parsed)
      ? parsed
          .map((item) => ({
            id: String(item?.id || '').trim(),
            nombre: String(item?.nombre || '').trim(),
            obligatorio: Boolean(item?.obligatorio),
          }))
          .filter((item) => item.id && item.nombre)
      : []
  } catch {
    documentosRequeridos = []
  }

  if (!proyecto_id || !numero || !fecha || !monto) {
    return { success: false, error: 'Faltan datos del estado de pago' }
  }

  const faltantes = documentosRequeridos.filter((documento) => {
    if (!documento.obligatorio) return false
    const file = formData.get(`documento_requerido_${documento.id}`) as File | null
    return !file || file.size === 0
  })

  if (faltantes.length > 0) {
    return {
      success: false,
      error: `Faltan documentos obligatorios: ${faltantes
        .map((documento) => documento.nombre)
        .join(', ')}.`,
    }
  }

  const { data: estadoPagoCreado, error } = await supabase
    .from('proyecto_estados_pago')
    .insert({
      proyecto_id,
      numero,
      fecha,
      monto,
      avance_fisico,
      estado: 'pendiente_pago',
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  for (const documento of documentosRequeridos) {
    const file = formData.get(`documento_requerido_${documento.id}`) as File | null

    if (!file || file.size === 0) continue

    let documentoMeta: EstadoPagoDocumentoMeta | null = null

    try {
      documentoMeta = await uploadDocumento({
        supabase,
        proyectoId: proyecto_id,
        estadoPagoId: estadoPagoCreado.id,
        file,
        tipo: `requerido-${documento.id}`,
      })
    } catch (uploadError) {
      return {
        success: false,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : `No se pudo subir el documento ${documento.nombre}.`,
      }
    }

    const { error: documentoError } = await supabase.from('documentos_proyecto').insert({
      proyecto_id,
      catalogo_documento_id: null,
      nombre: documento.nombre,
      nombre_archivo: documentoMeta?.nombre_archivo ?? file.name,
      ruta_storage: documentoMeta?.ruta_storage,
      bucket: documentoMeta?.bucket,
      tipo_documento: 'Documento estado de pago',
      etapa: 'ejecucion',
      extension: file.name.split('.').pop() || null,
      tamano_bytes: documentoMeta?.tamano_bytes,
      mime_type: documentoMeta?.mime_type,
      subido_por: authGuard.userId,
      fecha_subida: new Date().toISOString(),
      obligatorio: documento.obligatorio,
      estado_revision: 'subido',
      porcentaje_validacion: 100,
      observacion: `estado_pago_id:${estadoPagoCreado.id}`,
    })

    if (documentoError) {
      return {
        success: false,
        error: documentoError.message || `No se pudo registrar ${documento.nombre}.`,
      }
    }
  }

  revalidatePath(`/cartera-proyectos/${proyecto_id}`)

  return { success: true }
}

export async function actualizarEstadoPagoEstado(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.ejecucionEdit)

  if (!authGuard.success) {
    return authGuard
  }

  const estadoPagoId = String(formData.get('estado_pago_id') || '')
  const proyectoId = String(formData.get('proyecto_id') || '')
  const estado = String(formData.get('estado') || '')

  if (!estadoPagoId || !proyectoId) {
    return { success: false, error: 'No se recibió el estado de pago.' }
  }

  if (!['pendiente_pago', 'pagado'].includes(estado)) {
    return { success: false, error: 'Selecciona un estado válido.' }
  }

  const { error } = await supabase
    .from('proyecto_estados_pago')
    .update({ estado })
    .eq('id', estadoPagoId)
    .eq('proyecto_id', proyectoId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

export async function obtenerUrlDocumentoEstadoPago({
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

export async function subirDocumentoEstadoPago(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.ejecucionEdit)

  const proyectoId = String(formData.get('proyecto_id') || '')
  const estadoPagoId = String(formData.get('estado_pago_id') || '')
  const file = formData.get('documento') as File | null

  if (!proyectoId || !estadoPagoId) {
    return { success: false, error: 'No se recibió el estado de pago.' }
  }

  if (!file || file.size === 0) {
    return { success: false, error: 'Selecciona un documento para subir.' }
  }

  if (!authGuard.success) {
    return authGuard
  }

  const safeFileName = file.name.replace(/\s+/g, '-')
  let documentoMeta: EstadoPagoDocumentoMeta | null = null

  try {
    documentoMeta = await uploadDocumento({
      supabase,
      proyectoId,
      estadoPagoId,
      file,
      tipo: 'documento',
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo subir el documento.',
    }
  }

  const { error: insertError } = await supabase.from('documentos_proyecto').insert({
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre: documentoMeta?.nombre ?? safeFileName,
    nombre_archivo: documentoMeta?.nombre_archivo ?? safeFileName,
    ruta_storage: documentoMeta?.ruta_storage,
    bucket: documentoMeta?.bucket,
    tipo_documento: 'Documento estado de pago',
    etapa: 'ejecucion',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: documentoMeta?.tamano_bytes,
    mime_type: documentoMeta?.mime_type,
    subido_por: authGuard.userId,
    fecha_subida: new Date().toISOString(),
    obligatorio: false,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: `estado_pago_id:${estadoPagoId}`,
  })

  if (insertError) {
    return {
      success: false,
      error: insertError.message || 'No se pudo registrar el documento.',
    }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'subir_documento_estado_pago',
    descripcion: `Documento cargado para estado de pago: ${file.name}`,
    usuario_id: authGuard.userId,
    metadata: {
      etapa: 'ejecucion',
      estado_pago_id: estadoPagoId,
      nombre_archivo: file.name,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

export async function guardarInformacionPagoProveedor(formData: FormData) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.ejecucionEdit)

  const proyectoId = String(formData.get('proyecto_id') || '')
  const estadoPagoId = String(formData.get('estado_pago_id') || '')
  const fechaTransferencia = String(formData.get('fecha_transferencia') || '').trim()
  const numeroCartola = String(formData.get('numero_cartola') || '').trim()
  const numeroDecretoPago = String(formData.get('numero_decreto_pago') || '').trim()
  const cartolaFile = formData.get('cartola') as File | null
  const decretoFile = formData.get('decreto_pago') as File | null

  if (!proyectoId || !estadoPagoId) {
    return { success: false, error: 'No se recibió el estado de pago.' }
  }

  if (!fechaTransferencia || !numeroCartola || !numeroDecretoPago) {
    return { success: false, error: 'Completa la fecha, número de cartola y decreto de pago.' }
  }

  if (!authGuard.success) {
    return authGuard
  }

  const { data: registros, error: registroError } = await supabase
    .from('proyecto_bitacora')
    .select('id, metadata')
    .eq('proyecto_id', proyectoId)
    .eq('tipo', 'pago_proveedor')

  if (registroError) {
    return { success: false, error: registroError.message }
  }

  const registroActual = (registros ?? []).find((registro) => {
    const metadata = registro.metadata as { estado_pago_id?: string } | null
    return metadata?.estado_pago_id === estadoPagoId
  })

  const metadataActual = registroActual?.metadata as {
    cartola?: EstadoPagoDocumentoMeta | null
    decreto_pago?: EstadoPagoDocumentoMeta | null
  } | null

  let cartola = metadataActual?.cartola ?? null
  let decretoPago = metadataActual?.decreto_pago ?? null

  try {
    cartola =
      (await uploadDocumento({
        supabase,
        proyectoId,
        estadoPagoId,
        file: cartolaFile,
        tipo: 'cartola',
      })) ?? cartola
    decretoPago =
      (await uploadDocumento({
        supabase,
        proyectoId,
        estadoPagoId,
        file: decretoFile,
        tipo: 'decreto-pago',
      })) ?? decretoPago
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron subir los documentos.',
    }
  }

  const metadata = {
    modulo: 'ejecucion',
    estado_pago_id: estadoPagoId,
    fecha_transferencia: fechaTransferencia,
    numero_cartola: numeroCartola,
    numero_decreto_pago: numeroDecretoPago,
    cartola,
    decreto_pago: decretoPago,
  }

  const mutation = registroActual?.id
    ? supabase
        .from('proyecto_bitacora')
        .update({
          titulo: 'Información de pago a proveedor',
          descripcion: `Pago registrado con cartola ${numeroCartola}`,
          metadata,
        })
        .eq('id', registroActual.id)
    : supabase.from('proyecto_bitacora').insert({
        proyecto_id: proyectoId,
        usuario_id: authGuard.userId,
        tipo: 'pago_proveedor',
        titulo: 'Información de pago a proveedor',
        descripcion: `Pago registrado con cartola ${numeroCartola}`,
        metadata,
      })

  const { error } = await mutation

  if (error) return { success: false, error: error.message }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'registrar_pago_proveedor',
    descripcion: `Información de pago registrada para estado de pago ${estadoPagoId}.`,
    usuario_id: authGuard.userId,
    metadata,
  })

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

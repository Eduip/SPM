'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'

export async function crearEstadoPago(formData: FormData) {
  const supabase = await createClient()

  const proyecto_id = String(formData.get('proyecto_id') || '')
  const numero = Number(formData.get('numero'))
  const fecha = String(formData.get('fecha'))
  const monto = Number(formData.get('monto'))
  const avance_fisico = Number(formData.get('avance_fisico'))

  if (!proyecto_id || !numero || !fecha || !monto) {
    return { success: false, error: 'Faltan datos del estado de pago' }
  }

  const { error } = await supabase
    .from('proyecto_estados_pago')
    .insert({
      proyecto_id,
      numero,
      fecha,
      monto,
      avance_fisico,
      estado: 'pendiente_pago',
    })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function actualizarEstadoPagoEstado(formData: FormData) {
  const supabase = await createClient()

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

export async function subirDocumentoEstadoPago(formData: FormData) {
  const supabase = await createClient()

  const proyectoId = String(formData.get('proyecto_id') || '')
  const estadoPagoId = String(formData.get('estado_pago_id') || '')
  const file = formData.get('documento') as File | null

  if (!proyectoId || !estadoPagoId) {
    return { success: false, error: 'No se recibió el estado de pago.' }
  }

  if (!file || file.size === 0) {
    return { success: false, error: 'Selecciona un documento para subir.' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/ejecucion/estados-pago/${estadoPagoId}/${Date.now()}-${safeFileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message || 'No se pudo subir el documento.',
    }
  }

  const { error: insertError } = await supabase.from('documentos_proyecto').insert({
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: 'Documento estado de pago',
    etapa: 'ejecucion',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: file.size,
    mime_type: file.type || null,
    subido_por: user.id,
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
    usuario_id: user.id,
    metadata: {
      etapa: 'ejecucion',
      estado_pago_id: estadoPagoId,
      nombre_archivo: file.name,
    },
  })

  revalidatePath(`/cartera-proyectos/${proyectoId}`)

  return { success: true }
}

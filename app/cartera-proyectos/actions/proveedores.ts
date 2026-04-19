'use server'

import { createClient } from '../../../lib/supabase-server'

async function uploadProveedorDocumento({
  supabase,
  proyectoId,
  file,
  tipo,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  proyectoId: string
  file: File | null
  tipo: string
}) {
  if (!file || file.size === 0) return null

  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/proveedores/${Date.now()}-${tipo}-${safeFileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    throw new Error(error.message || `No se pudo subir ${file.name}.`)
  }

  return {
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    mime_type: file.type || null,
    tamano_bytes: file.size,
  }
}

export async function crearProveedorProyecto(formData: FormData) {
  const supabase = await createClient()

  const proyectoId = String(formData.get('proyecto_id') || '')
  const tipoProveedor = String(formData.get('tipo_proveedor') || '')
  const razonSocial = String(formData.get('razon_social') || '').trim()
  const rut = String(formData.get('rut') || '').trim()
  const rubro = String(formData.get('rubro') || '').trim()
  const correo = String(formData.get('correo') || '').trim()
  const telefono = String(formData.get('telefono') || '').trim()
  const tipoContratacion = String(formData.get('tipo_contratacion') || '').trim()
  const tipoServicio = String(formData.get('tipo_servicio') || '').trim()
  const descripcionServicio = String(formData.get('descripcion_servicio') || '').trim()
  const plazoDesde = String(formData.get('plazo_desde') || '').trim()
  const plazoHasta = String(formData.get('plazo_hasta') || '').trim()
  const documentoContratacion = formData.get('documento_contratacion') as File | null
  const decretoAdministrativo = formData.get('decreto_administrativo') as File | null

  if (!proyectoId) {
    return { success: false, error: 'No se recibió el proyecto.' }
  }

  if (tipoProveedor !== 'persona_juridica') {
    return {
      success: false,
      error: 'Por ahora solo está habilitado el registro de Persona jurídica.',
    }
  }

  if (
    !razonSocial ||
    !rut ||
    !rubro ||
    !correo ||
    !telefono ||
    !tipoContratacion ||
    !tipoServicio ||
    !descripcionServicio ||
    !plazoDesde ||
    !plazoHasta
  ) {
    return { success: false, error: 'Completa todos los campos obligatorios.' }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'No se pudo identificar al usuario autenticado.' }
  }

  let documentoContratacionMeta = null
  let decretoAdministrativoMeta = null

  try {
    documentoContratacionMeta = await uploadProveedorDocumento({
      supabase,
      proyectoId,
      file: documentoContratacion,
      tipo: 'contratacion',
    })
    decretoAdministrativoMeta = await uploadProveedorDocumento({
      supabase,
      proyectoId,
      file: decretoAdministrativo,
      tipo: 'decreto',
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudieron subir los documentos.',
    }
  }

  const metadata = {
    modulo: 'proveedores',
    tipo_proveedor: tipoProveedor,
    datos_empresa: {
      razon_social: razonSocial,
      rut,
      rubro,
      correo,
      telefono,
    },
    contratacion: {
      tipo_contratacion: tipoContratacion,
      documento_contratacion: documentoContratacionMeta,
      decreto_administrativo: decretoAdministrativoMeta,
    },
    servicio: {
      tipo_servicio: tipoServicio,
      descripcion_servicio: descripcionServicio,
      plazo_desde: plazoDesde,
      plazo_hasta: plazoHasta,
    },
  }

  const { error } = await supabase.from('proyecto_bitacora').insert({
    proyecto_id: proyectoId,
    usuario_id: user.id,
    tipo: 'proveedor',
    titulo: razonSocial,
    descripcion: descripcionServicio,
    metadata,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from('historial_eventos').insert({
    entidad: 'proyecto',
    entidad_id: proyectoId,
    accion: 'proveedor_creado',
    descripcion: `Proveedor agregado: ${razonSocial}`,
    usuario_id: user.id,
    metadata,
  })

  return { success: true }
}

'use server'

import { createClient } from '../../../lib/supabase-server'
import { requireAdmin } from '../../../lib/auth-guards'
import { saveFieldAIConfig, type FieldAIMode } from '../../../lib/ai/field-ai-config'
import type { TableFieldConfig } from '../../../lib/formulacion-types'
import {
  createEstadoPagoDocumentConfig,
  deleteEstadoPagoDocumentConfig,
} from '../../../lib/estado-pago-document-config'
import { createDefaultTableFieldConfig, normalizeTableFieldConfig } from '../../../lib/table-field-config'

export async function crearFuenteFinanciamiento(formData: FormData) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const nombre = String(formData.get('nombre') || '').trim()
  const activo = formData.get('activo') === 'on'

  if (!nombre) {
    return { success: false, error: 'El nombre es obligatorio.' }
  }

  const codigoBase = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((p) => p.toUpperCase())
    .join('-')
    .slice(0, 20)

  const { data: existingFuente, error: existingFuenteError } = await supabase
    .from('fuentes_financiamiento')
    .select('id, activo, codigo')
    .eq('nombre', nombre)
    .maybeSingle()

  if (existingFuenteError) {
    return { success: false, error: existingFuenteError.message }
  }

  if (existingFuente?.activo) {
    return { success: false, error: 'Ya existe una fuente activa con ese nombre.' }
  }

  if (existingFuente) {
    const { error } = await supabase
      .from('fuentes_financiamiento')
      .update({
        nombre,
        activo,
        codigo: codigoBase || existingFuente.codigo || null,
      })
      .eq('id', existingFuente.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const { data: existingFuenteByCode, error: existingFuenteByCodeError } = await supabase
    .from('fuentes_financiamiento')
    .select('id, activo')
    .eq('codigo', codigoBase)
    .maybeSingle()

  if (existingFuenteByCodeError) {
    return { success: false, error: existingFuenteByCodeError.message }
  }

  if (existingFuenteByCode?.activo) {
    return { success: false, error: 'Ya existe una fuente activa con ese nombre.' }
  }

  if (existingFuenteByCode) {
    const { error } = await supabase
      .from('fuentes_financiamiento')
      .update({
        nombre,
        activo,
        codigo: codigoBase || null,
      })
      .eq('id', existingFuenteByCode.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const { error } = await supabase
    .from('fuentes_financiamiento')
    .insert({
      nombre,
      activo,
      codigo: codigoBase || null,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function eliminarFuenteFinanciamiento(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió la fuente a eliminar.' }
  }

  const { error } = await supabase
    .from('fuentes_financiamiento')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function actualizarFuenteFinanciamiento({
  id,
  nombre,
  activo,
}: {
  id: string
  nombre: string
  activo: boolean
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar.' }
  }

  const { error } = await supabase
    .from('fuentes_financiamiento')
    .update({
      nombre: nombre.trim(),
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function guardarConfiguracionFuente({
  id,
  payload,
}: {
  id: string
  payload: {
    nombre: string
    codigo: string
    descripcion: string
    activo: boolean
    requiere_evaluacion_tecnica: boolean
    requiere_rendicion_obligatoria: boolean
    requiere_aprobacion_externa: boolean
  }
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !payload.nombre.trim()) {
    return { success: false, error: 'Faltan datos para guardar la configuración.' }
  }

  const { error } = await supabase
    .from('fuentes_financiamiento')
    .update({
      nombre: payload.nombre.trim(),
      codigo: payload.codigo.trim() || null,
      descripcion: payload.descripcion.trim() || null,
      activo: payload.activo,
      requiere_evaluacion_tecnica: payload.requiere_evaluacion_tecnica,
      requiere_rendicion_obligatoria: payload.requiere_rendicion_obligatoria,
      requiere_aprobacion_externa: payload.requiere_aprobacion_externa,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function crearCampoFuente({
    fuente_id,
    nombre,
    descripcion_campo,
    seccion_id,
    grupo,
    subgrupo,
    orden_codigo,
    config_json,
    tipo,
    obligatorio,
  }: {
    fuente_id: string
    nombre: string
    descripcion_campo?: string
    seccion_id?: string
    grupo?: string
    subgrupo?: string
    orden_codigo?: string
    config_json?: TableFieldConfig | null
    tipo: string
    obligatorio: boolean
  }) {
    const supabase = await createClient()
    const adminGuard = await requireAdmin(supabase)

    if (!adminGuard.success) {
      return adminGuard
    }

    if (!fuente_id || !nombre.trim()) {
      return { success: false, error: 'Faltan datos para crear el campo.' }
    }

    const normalizedTipo = normalizeCampoTipo(tipo)

    const { data: ultimoCampo } = await supabase
      .from('campos_formulario_fuente')
      .select('orden')
      .eq('fuente_id', fuente_id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()
  
    const { error } = await supabase
      .from('campos_formulario_fuente')
      .insert({
        fuente_id,
        nombre: nombre.trim(),
        descripcion_campo: descripcion_campo?.trim() || null,
        seccion_id: seccion_id?.trim() || null,
        grupo: grupo?.trim() || null,
        subgrupo: subgrupo?.trim() || null,
        orden_codigo: orden_codigo?.trim() || String(Number(ultimoCampo?.orden ?? 0) + 1),
        config_json:
          normalizedTipo === 'tabla_estructurada'
            ? normalizeTableFieldConfig(config_json ?? createDefaultTableFieldConfig())
            : null,
        tipo: normalizedTipo,
        obligatorio,
        visible: true,
        orden: Number(ultimoCampo?.orden ?? 0) + 1,
      })
  
    if (error) return { success: false, error: error.message }
  
  return { success: true }
  }

export async function actualizarCampoFuente({
  id,
  nombre,
  descripcion_campo,
  seccion_id,
  grupo,
  subgrupo,
  orden_codigo,
  config_json,
  tipo,
  obligatorio,
  ai_mode,
}: {
  id: string
  nombre: string
  descripcion_campo?: string
  seccion_id?: string
  grupo?: string
  subgrupo?: string
  orden_codigo?: string
  config_json?: TableFieldConfig | null
  tipo: string
  obligatorio: boolean
  ai_mode: FieldAIMode
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar el campo.' }
  }

  const normalizedTipo = normalizeCampoTipo(tipo)

  const { error } = await supabase
    .from('campos_formulario_fuente')
    .update({
      nombre: nombre.trim(),
      descripcion_campo: descripcion_campo?.trim() || null,
      seccion_id: seccion_id?.trim() || null,
      grupo: grupo?.trim() || null,
      subgrupo: subgrupo?.trim() || null,
      orden_codigo: orden_codigo?.trim() || null,
      config_json:
        normalizedTipo === 'tabla_estructurada'
          ? normalizeTableFieldConfig(config_json ?? createDefaultTableFieldConfig())
          : null,
      tipo: normalizedTipo,
      obligatorio,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await saveFieldAIConfig(id, ai_mode)

  return { success: true }
}

export async function crearSeccionFuente({
  fuente_id,
  nombre,
  orden,
}: {
  fuente_id: string
  nombre: string
  orden?: number
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!fuente_id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para crear la sección.' }
  }

  const { data: ultimaSeccion } = await supabase
    .from('secciones_formulario_fuente')
    .select('orden')
    .eq('fuente_id', fuente_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordenFinal =
    Number.isFinite(orden) && Number(orden) > 0
      ? Number(orden)
      : Number(ultimaSeccion?.orden ?? 0) + 1

  const { error } = await supabase.from('secciones_formulario_fuente').insert({
    fuente_id,
    nombre: nombre.trim(),
    orden: ordenFinal,
    activa: true,
  })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function actualizarSeccionFuente({
  id,
  nombre,
  orden,
}: {
  id: string
  nombre: string
  orden: number
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar la sección.' }
  }

  const { error } = await supabase
    .from('secciones_formulario_fuente')
    .update({
      nombre: nombre.trim(),
      orden: Number.isFinite(orden) && orden > 0 ? orden : 1,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function eliminarSeccionFuente(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió la sección a eliminar.' }
  }

  const { error: camposError } = await supabase
    .from('campos_formulario_fuente')
    .update({ seccion_id: null })
    .eq('seccion_id', id)

  if (camposError) return { success: false, error: camposError.message }

  await supabase
    .from('subsecciones_formulario_fuente')
    .update({ activa: false })
    .eq('seccion_id', id)

  const { error } = await supabase
    .from('secciones_formulario_fuente')
    .update({ activa: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function crearSubseccionFuente({
  fuente_id,
  seccion_id,
  nombre,
  orden,
}: {
  fuente_id: string
  seccion_id: string
  nombre: string
  orden?: number
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!fuente_id || !seccion_id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para crear la subsección.' }
  }

  const { data: ultimaSubseccion } = await supabase
    .from('subsecciones_formulario_fuente')
    .select('orden')
    .eq('seccion_id', seccion_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordenFinal =
    Number.isFinite(orden) && Number(orden) > 0
      ? Number(orden)
      : Number(ultimaSubseccion?.orden ?? 0) + 1

  const { error } = await supabase.from('subsecciones_formulario_fuente').insert({
    fuente_id,
    seccion_id,
    nombre: nombre.trim(),
    orden: ordenFinal,
    activa: true,
  })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function actualizarSubseccionFuente({
  id,
  nombre,
  orden,
}: {
  id: string
  nombre: string
  orden: number
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar la subsección.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('subsecciones_formulario_fuente')
    .select('id, seccion_id, nombre')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return { success: false, error: existingError.message }
  if (!existing) return { success: false, error: 'No se encontró la subsección.' }

  const nextName = nombre.trim()

  const { error } = await supabase
    .from('subsecciones_formulario_fuente')
    .update({
      nombre: nextName,
      orden: Number.isFinite(orden) && orden > 0 ? orden : 1,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  if (existing.nombre?.trim() && existing.nombre.trim() !== nextName) {
    const { error: camposError } = await supabase
      .from('campos_formulario_fuente')
      .update({ subgrupo: nextName })
      .eq('seccion_id', existing.seccion_id)
      .eq('subgrupo', existing.nombre.trim())

    if (camposError) return { success: false, error: camposError.message }
  }

  return { success: true }
}

export async function eliminarSubseccionFuente(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió la subsección a eliminar.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('subsecciones_formulario_fuente')
    .select('id, seccion_id, nombre')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return { success: false, error: existingError.message }
  if (!existing) return { success: false, error: 'No se encontró la subsección.' }

  const { error: camposError } = await supabase
    .from('campos_formulario_fuente')
    .update({ subgrupo: null })
    .eq('seccion_id', existing.seccion_id)
    .eq('subgrupo', existing.nombre)

  if (camposError) return { success: false, error: camposError.message }

  const { error } = await supabase
    .from('subsecciones_formulario_fuente')
    .update({ activa: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

function normalizeCampoTipo(tipo: string) {
  const allowed = new Set([
    'texto',
    'texto_largo',
    'numero',
    'fecha',
    'booleano',
    'tabla_estructurada',
    'plazo',
    'presupuesto',
  ])

  return allowed.has(tipo) ? tipo : 'texto'
}

export async function eliminarCampoFuente(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió el campo a eliminar.' }
  }

  const { error } = await supabase
    .from('campos_formulario_fuente')
    .update({ visible: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function crearDocumentoFuente({
  fuente_id,
  nombre,
  obligatorio,
}: {
  fuente_id: string
  nombre: string
  obligatorio: boolean
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!fuente_id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para crear el documento.' }
  }

  const { data: ultimoDocumento } = await supabase
    .from('documentos_fuente')
    .select('orden')
    .eq('fuente_id', fuente_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('documentos_fuente')
    .insert({
      fuente_id,
      nombre: nombre.trim(),
      obligatorio,
      orden: Number(ultimoDocumento?.orden ?? 0) + 1,
    })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function eliminarDocumentoFuente(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió el documento a eliminar.' }
  }

  const { error } = await supabase
    .from('documentos_fuente')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function crearDocumentoEstadoPagoFuente({
  fuente_id,
  nombre,
  obligatorio,
}: {
  fuente_id: string
  nombre: string
  obligatorio: boolean
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  return createEstadoPagoDocumentConfig({
    fuenteId: fuente_id,
    nombre,
    obligatorio,
  })
}

export async function eliminarDocumentoEstadoPagoFuente(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  return deleteEstadoPagoDocumentConfig(id)
}

  export async function crearReglaFuente({
    fuente_id,
    descripcion,
  }: {
    fuente_id: string
    descripcion: string
  }) {
    const supabase = await createClient()
    const adminGuard = await requireAdmin(supabase)

    if (!adminGuard.success) {
      return adminGuard
    }
  
    const { error } = await supabase
      .from('reglas_validacion_fuente')
      .insert({
        fuente_id,
        descripcion,
      })
  
    if (error) return { success: false, error: error.message }
  
    return { success: true }
  }

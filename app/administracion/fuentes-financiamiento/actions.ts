'use server'

import { createClient } from '../../../lib/supabase-server'

export async function crearFuenteFinanciamiento(formData: FormData) {
  const supabase = await createClient()

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
    .select('id, activo')
    .eq('codigo', codigoBase)
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
        codigo: codigoBase || null,
      })
      .eq('id', existingFuente.id)

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
    tipo,
    obligatorio,
  }: {
    fuente_id: string
    nombre: string
    tipo: string
    obligatorio: boolean
  }) {
    const supabase = await createClient()

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
  tipo,
  obligatorio,
}: {
  id: string
  nombre: string
  tipo: string
  obligatorio: boolean
}) {
  const supabase = await createClient()

  if (!id || !nombre.trim()) {
    return { success: false, error: 'Faltan datos para actualizar el campo.' }
  }

  const normalizedTipo = normalizeCampoTipo(tipo)

  const { error } = await supabase
    .from('campos_formulario_fuente')
    .update({
      nombre: nombre.trim(),
      tipo: normalizedTipo,
      obligatorio,
    })
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
    'plazo',
    'presupuesto',
  ])

  return allowed.has(tipo) ? tipo : 'texto'
}

export async function eliminarCampoFuente(id: string) {
  const supabase = await createClient()

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

  export async function crearReglaFuente({
    fuente_id,
    descripcion,
  }: {
    fuente_id: string
    descripcion: string
  }) {
    const supabase = await createClient()
  
    const { error } = await supabase
      .from('reglas_validacion_fuente')
      .insert({
        fuente_id,
        descripcion,
      })
  
    if (error) return { success: false, error: error.message }
  
    return { success: true }
  }

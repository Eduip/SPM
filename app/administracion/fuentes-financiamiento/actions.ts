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
    monto_minimo: number
    monto_maximo: number
    tipo_financiamiento: string
    plazo_maximo_meses: number
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
      monto_minimo: Number(payload.monto_minimo || 0),
      monto_maximo: Number(payload.monto_maximo || 0),
      tipo_financiamiento: payload.tipo_financiamiento || 'Total',
      plazo_maximo_meses: Number(payload.plazo_maximo_meses || 0),
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
  }: {
    fuente_id: string
    nombre: string
    tipo: string
  }) {
    const supabase = await createClient()
  
    const { error } = await supabase
      .from('campos_formulario_fuente')
      .insert({
        fuente_id,
        nombre,
        tipo,
        obligatorio: false,
        visible: true,
      })
  
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
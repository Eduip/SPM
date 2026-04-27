'use server'

import { createClient } from '../../../lib/supabase-server'
import { requireAdmin } from '../../../lib/auth-guards'

export async function crearTipoAlerta(formData: FormData) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const nombre = String(formData.get('nombre') || '').trim()
  const codigo = String(formData.get('codigo') || '').trim()
  const modulo = String(formData.get('modulo') || '').trim()
  const severidad = String(formData.get('severidad') || '').trim()
  const descripcion = buildRuleDescription(formData)
  const activo = formData.get('activo') === 'on'

  if (!nombre || !modulo || !severidad || !descripcion) {
    return { success: false, error: 'Nombre, módulo, prioridad y condición son obligatorios.' }
  }

  const normalizedCode = codigo || generateAlertCode(nombre)
  const color = getPriorityColor(severidad)

  const { error } = await supabase
    .from('tipos_alerta')
    .insert({
      nombre,
      codigo: normalizedCode || null,
      modulo,
      severidad,
      color,
      descripcion: descripcion || null,
      activo,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function actualizarTipoAlerta({
  id,
  nombre,
  codigo,
  modulo,
  severidad,
  descripcion,
  activo,
}: {
  id: string
  nombre: string
  codigo: string
  modulo: string
  severidad: string
  descripcion: string
  activo: boolean
}) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id || !nombre.trim() || !modulo.trim() || !severidad.trim() || !descripcion.trim()) {
    return { success: false, error: 'Faltan datos para actualizar la regla de alerta.' }
  }

  const { error } = await supabase
    .from('tipos_alerta')
    .update({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      modulo: modulo.trim(),
      severidad: severidad.trim(),
      color: getPriorityColor(severidad),
      descripcion: descripcion.trim() || null,
      activo,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function eliminarTipoAlerta(id: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!id) {
    return { success: false, error: 'No se recibió la regla de alerta a eliminar.' }
  }

  const { error } = await supabase
    .from('tipos_alerta')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function activarTodasAlertas() {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const { error } = await supabase
    .from('tipos_alerta')
    .update({ activo: true })
    .neq('activo', true)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

function generateAlertCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join('_')
    .slice(0, 60)
}

function getPriorityColor(priority: string) {
  if (priority === 'critica') return '#ef4444'
  if (priority === 'alta') return '#f97316'
  if (priority === 'media') return '#f59e0b'
  return '#2563eb'
}

function buildRuleDescription(formData: FormData) {
  const campo = String(formData.get('campo') || '').trim()
  const operador = String(formData.get('operador') || '').trim()
  const valor = String(formData.get('valor') || '').trim()
  const unidad = String(formData.get('unidad') || '').trim()
  const mensaje = String(formData.get('mensaje') || '').trim()
  const condicion = String(formData.get('descripcion') || formData.get('condicion') || '').trim()

  if (!campo || !operador || !valor) {
    return condicion
  }

  return JSON.stringify({
    kind: 'alert_rule',
    version: 1,
    field: campo,
    operator: operador,
    value: valor,
    unit: unidad || null,
    message: mensaje || null,
  })
}

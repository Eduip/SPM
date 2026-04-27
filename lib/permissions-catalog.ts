import type { createClient } from './supabase-server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export type BasePermission = {
  nombre: string
  codigo: string
  modulo: string
  descripcion: string
}

export const BASE_PERMISSIONS: BasePermission[] = [
  {
    nombre: 'Ver dashboard',
    codigo: 'dashboard.view',
    modulo: 'dashboard',
    descripcion: 'Permite acceder al módulo Dashboard.',
  },
  {
    nombre: 'Ver alertas',
    codigo: 'alertas.view',
    modulo: 'alertas',
    descripcion: 'Permite acceder al módulo de Alertas.',
  },
  {
    nombre: 'Gestionar alertas',
    codigo: 'alertas.manage',
    modulo: 'alertas',
    descripcion: 'Permite gestionar reglas y acciones asociadas a alertas.',
  },
  {
    nombre: 'Ver administración',
    codigo: 'administracion.view',
    modulo: 'administracion',
    descripcion: 'Permite acceder al módulo de Administración.',
  },
  {
    nombre: 'Gestionar administración',
    codigo: 'administracion.manage',
    modulo: 'administracion',
    descripcion: 'Permite crear, editar y eliminar configuraciones administrativas.',
  },
  {
    nombre: 'Ver proyectos',
    codigo: 'proyectos.view',
    modulo: 'general',
    descripcion: 'Permite ver el listado de proyectos y la pestaña General.',
  },
  {
    nombre: 'Crear proyectos',
    codigo: 'proyectos.create',
    modulo: 'general',
    descripcion: 'Permite crear nuevos proyectos en Creación y Formulación.',
  },
  {
    nombre: 'Editar proyectos',
    codigo: 'proyectos.edit',
    modulo: 'general',
    descripcion: 'Permite editar proyectos durante Creación y Formulación.',
  },
  {
    nombre: 'Aprobar proyectos',
    codigo: 'proyectos.approve',
    modulo: 'general',
    descripcion: 'Permite aprobar proyectos al finalizar la formulación.',
  },
  {
    nombre: 'Ver proveedores',
    codigo: 'proveedores.view',
    modulo: 'proveedores',
    descripcion: 'Permite ver la pestaña Proveedores en la ficha del proyecto.',
  },
  {
    nombre: 'Editar proveedores',
    codigo: 'proveedores.edit',
    modulo: 'proveedores',
    descripcion: 'Permite crear, editar y eliminar proveedores del proyecto.',
  },
  {
    nombre: 'Ver ejecución',
    codigo: 'ejecucion.view',
    modulo: 'ejecucion',
    descripcion: 'Permite ver la pestaña Ejecución en la ficha del proyecto.',
  },
  {
    nombre: 'Editar ejecución',
    codigo: 'ejecucion.edit',
    modulo: 'ejecucion',
    descripcion: 'Permite registrar estados de pago, documentos e información de pago.',
  },
  {
    nombre: 'Ver financiamiento',
    codigo: 'financiamiento.view',
    modulo: 'financiamiento',
    descripcion: 'Permite ver la pestaña Financiamiento en la ficha del proyecto.',
  },
  {
    nombre: 'Editar financiamiento',
    codigo: 'financiamiento.edit',
    modulo: 'financiamiento',
    descripcion: 'Permite crear, editar y eliminar transferencias.',
  },
  {
    nombre: 'Ver rendiciones',
    codigo: 'rendiciones.view',
    modulo: 'rendiciones',
    descripcion: 'Permite ver la pestaña Rendición en la ficha del proyecto.',
  },
  {
    nombre: 'Editar rendiciones',
    codigo: 'rendiciones.edit',
    modulo: 'rendiciones',
    descripcion: 'Permite crear, editar, eliminar y adjuntar documentos de rendición.',
  },
  {
    nombre: 'Ver garantías',
    codigo: 'garantias.view',
    modulo: 'garantias',
    descripcion: 'Permite ver la pestaña Garantías en la ficha del proyecto.',
  },
  {
    nombre: 'Editar garantías',
    codigo: 'garantias.edit',
    modulo: 'garantias',
    descripcion: 'Permite crear, editar, eliminar y adjuntar documentos de garantías.',
  },
  {
    nombre: 'Ver bitácora',
    codigo: 'bitacora.view',
    modulo: 'bitacora',
    descripcion: 'Permite ver la pestaña Bitácora en la ficha del proyecto.',
  },
  {
    nombre: 'Editar bitácora',
    codigo: 'bitacora.edit',
    modulo: 'bitacora',
    descripcion: 'Permite crear, editar y eliminar entradas de bitácora.',
  },
  {
    nombre: 'Ver historial',
    codigo: 'historial.view',
    modulo: 'historial',
    descripcion: 'Permite ver la pestaña Historial y el detalle de eventos.',
  },
]

export async function ensureBasePermissions(supabase: SupabaseClient) {
  const { data: existing, error: existingError } = await supabase
    .from('permisos')
    .select('codigo')

  if (existingError) {
    return { success: false, error: existingError.message, inserted: 0 }
  }

  const existingCodes = new Set(
    (existing ?? []).map((permission) => String(permission.codigo ?? ''))
  )
  const missingPermissions = BASE_PERMISSIONS.filter(
    (permission) => !existingCodes.has(permission.codigo)
  )

  if (missingPermissions.length === 0) {
    return { success: true, inserted: 0 }
  }

  const { error: insertError } = await supabase
    .from('permisos')
    .insert(missingPermissions)

  if (insertError) {
    return { success: false, error: insertError.message, inserted: 0 }
  }

  return { success: true, inserted: missingPermissions.length }
}

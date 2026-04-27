import type { User } from '@supabase/supabase-js'
import type { createClient } from './supabase-server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type GuardSuccess = {
  success: true
  user: User
  userId: string
}

type GuardFailure = {
  success: false
  error: string
}

type RoleValue =
  | {
      id?: string | null
      codigo?: string | null
      nombre?: string | null
    }
  | Array<{
      id?: string | null
      codigo?: string | null
      nombre?: string | null
    }>
  | null

type PermissionRow = {
  permiso?:
    | {
        codigo?: string | null
        modulo?: string | null
        nombre?: string | null
      }
    | Array<{
        codigo?: string | null
        modulo?: string | null
        nombre?: string | null
      }>
    | null
}

export type Authorization = GuardSuccess & {
  isAdmin: boolean
  roleId: string | null
  roleCode: string
  roleName: string
  permissionCodes: Set<string>
  permissionModules: Set<string>
  permissions: Array<{
    codigo: string
    modulo: string
    nombre: string
  }>
}

export const PERMISSIONS = {
  dashboardView: 'dashboard.view',
  carteraView: 'proyectos.view',
  carteraEdit: 'proyectos.edit',
  proyectosView: 'proyectos.view',
  proyectosCreate: 'proyectos.create',
  proyectosEdit: 'proyectos.edit',
  proyectosApprove: 'proyectos.approve',
  creacionView: 'proyectos.view',
  creacionEdit: 'proyectos.edit',
  ejecucionView: 'ejecucion.view',
  ejecucionEdit: 'ejecucion.edit',
  financiamientoView: 'financiamiento.view',
  financiamientoEdit: 'financiamiento.edit',
  rendicionesView: 'rendiciones.view',
  rendicionesEdit: 'rendiciones.edit',
  garantiasView: 'garantias.view',
  garantiasEdit: 'garantias.edit',
  proveedoresView: 'proveedores.view',
  proveedoresEdit: 'proveedores.edit',
  bitacoraView: 'bitacora.view',
  bitacoraEdit: 'bitacora.edit',
  historialView: 'historial.view',
  alertasView: 'alertas.view',
  alertasManage: 'alertas.manage',
  administracionView: 'administracion.view',
  administracionManage: 'administracion.manage',
} as const

const ADMIN_ROLE_CODES = new Set([
  'admin',
  'administrador',
  'super_admin',
  'superadministrador',
  'superusuario',
])

const MODULE_ALIASES: Record<string, string[]> = {
  dashboard: ['dashboard', 'tablero', 'inicio'],
  cartera: ['cartera', 'cartera_proyectos', 'cartera-proyectos', 'proyectos'],
  proyectos: ['proyectos', 'proyecto', 'cartera', 'cartera_proyectos', 'creacion', 'formulacion'],
  creacion: ['creacion', 'creacion_formulacion', 'creacion-formulacion', 'formulacion', 'proyectos'],
  ejecucion: ['ejecucion', 'ejecución'],
  financiamiento: ['financiamiento', 'transferencias', 'finanzas'],
  rendiciones: ['rendiciones', 'rendicion', 'rendición'],
  garantias: ['garantias', 'garantías', 'garantia', 'garantía'],
  proveedores: ['proveedores', 'proveedor'],
  bitacora: ['bitacora', 'bitácora'],
  historial: ['historial'],
  alertas: ['alertas', 'alerta'],
  administracion: ['administracion', 'admin', 'sistema'],
}

const ACTION_ALIASES: Record<string, string[]> = {
  view: ['view', 'ver', 'leer', 'consultar', 'listar', 'acceder', 'edit', 'editar', 'modificar', 'gestionar', 'manage'],
  create: ['create', 'crear', 'nuevo', 'registrar'],
  edit: ['edit', 'crear', 'editar', 'modificar', 'eliminar', 'gestionar', 'write', 'manage'],
  approve: ['approve', 'aprobar', 'aprobacion', 'aprobación'],
  manage: ['manage', 'gestionar', 'administrar', 'configurar', 'crear', 'editar', 'eliminar'],
}

export async function requireAuthenticated(
  supabase: SupabaseClient
): Promise<GuardSuccess | GuardFailure> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      success: false,
      error: 'No se pudo identificar al usuario autenticado.',
    }
  }

  return {
    success: true,
    user,
    userId: user.id,
  }
}

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<GuardSuccess | GuardFailure> {
  const authorization = await getAuthorization(supabase)

  if (!authorization.success) {
    return authorization
  }

  if (authorization.isAdmin || hasPermission(authorization, PERMISSIONS.administracionManage)) {
    return authorization
  }

  return {
    success: false,
    error: 'No tienes permisos de administración para realizar esta acción.',
  }
}

export async function getAuthorization(
  supabase: SupabaseClient
): Promise<Authorization | GuardFailure> {
  const auth = await requireAuthenticated(supabase)

  if (!auth.success) {
    return auth
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, activo, rol_id, rol:roles(id, codigo, nombre)')
    .eq('id', auth.userId)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data || data.activo === false) {
    return { success: false, error: 'El usuario no está activo en el sistema.' }
  }

  const role = normalizeRole(data?.rol as RoleValue)
  const roleId = data?.rol_id ?? role?.id ?? null
  const roleCode = normalizeRoleText(role?.codigo)
  const roleName = normalizeRoleText(role?.nombre)
  const isAdmin =
    ADMIN_ROLE_CODES.has(roleCode) ||
    roleName.includes('admin') ||
    roleName.includes('administrador')

  const { data: permissionRows, error: permissionsError } = roleId
    ? await supabase
        .from('roles_permisos')
        .select('permiso:permisos(codigo, modulo, nombre)')
        .eq('rol_id', roleId)
    : { data: [], error: null }

  if (permissionsError) {
    return { success: false, error: permissionsError.message }
  }

  const permissions = ((permissionRows ?? []) as PermissionRow[])
    .map((row) => normalizePermission(row.permiso))
    .filter((permission): permission is NonNullable<ReturnType<typeof normalizePermission>> =>
      Boolean(permission)
    )
    .map((permission) => ({
      codigo: normalizeRoleText(permission.codigo),
      modulo: normalizeModuleText(permission.modulo),
      nombre: normalizeRoleText(permission.nombre),
    }))

  return {
    ...auth,
    isAdmin,
    roleId,
    roleCode,
    roleName,
    permissions,
    permissionCodes: new Set(permissions.map((permission) => permission.codigo).filter(Boolean)),
    permissionModules: new Set(permissions.map((permission) => permission.modulo).filter(Boolean)),
  }
}

export async function requirePermission(
  supabase: SupabaseClient,
  permission: string | string[]
): Promise<Authorization | GuardFailure> {
  const authorization = await getAuthorization(supabase)

  if (!authorization.success) {
    return authorization
  }

  if (hasPermission(authorization, permission)) {
    return authorization
  }

  return {
    success: false,
    error: 'No tienes permisos para realizar esta acción.',
  }
}

export function hasPermission(
  authorization: Authorization | GuardFailure,
  permission: string | string[]
) {
  if (!authorization.success) return false
  if (authorization.isAdmin) return true

  const requiredPermissions = Array.isArray(permission) ? permission : [permission]

  return requiredPermissions.some((item) => {
    const normalized = normalizePermissionCode(item)
    if (normalized === PERMISSIONS.dashboardView) return true

    const [moduleName, action = 'view'] = normalized.split('.')
    const moduleAliases = MODULE_ALIASES[moduleName] ?? [moduleName]
    const actionAliases = ACTION_ALIASES[action] ?? [action]

    if (authorization.permissionCodes.has(normalized)) return true
    if (authorization.permissionCodes.has(`${moduleName}.*`)) return true
    if (authorization.permissionCodes.has(`${moduleName}.manage`)) return true

    const hasModule = moduleAliases.some((alias) =>
      authorization.permissionModules.has(normalizeModuleText(alias))
    )

    if (action === 'view' && hasModule) return true

    return authorization.permissions.some((userPermission) => {
      const haystack = [
        userPermission.codigo,
        userPermission.modulo,
        userPermission.nombre,
      ].join(' ')

      const matchesModule = moduleAliases.some((alias) =>
        haystack.includes(normalizeModuleText(alias))
      )
      const matchesAction = actionAliases.some((alias) =>
        haystack.includes(normalizeRoleText(alias))
      )

      return matchesModule && matchesAction
    })
  })
}

function normalizeRole(value: RoleValue) {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function normalizePermission(value: PermissionRow['permiso']) {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function normalizeRoleText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeModuleText(value?: string | null) {
  return normalizeRoleText(value).replace(/-/g, '_')
}

function normalizePermissionCode(value: string) {
  return normalizeRoleText(value).replace(/-/g, '_')
}

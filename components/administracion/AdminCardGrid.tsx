import AdminModuleCard from './AdminModuleCard'
import { getAuthorization, hasPermission, PERMISSIONS } from '../../lib/auth-guards'
import { createClient } from '../../lib/supabase-server'

const modules = [
  {
    title: 'Creación de Usuarios',
    subtitle: 'Administrar usuarios',
    description: 'Crear, editar y eliminar usuarios del sistema',
    bg: '#dbeafe',
    iconColor: '#2563eb',
    icon: '👥',
    href: '/administracion/usuarios',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Roles y Permisos',
    subtitle: 'Gestionar roles',
    description: 'Asignar y modificar roles y permisos',
    bg: '#dcfce7',
    iconColor: '#16a34a',
    icon: '🛡️',
    href: '/administracion/roles',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Estados del Sistema',
    subtitle: 'Configurar estados',
    description: 'Definir los estados posibles de los proyectos',
    bg: '#f3e8ff',
    iconColor: '#9333ea',
    icon: '🔗',
    href: '/administracion/estados',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Tipos de Alertas',
    subtitle: 'Configurar alertas',
    description: 'Definir y gestionar los tipos de alertas del sistema',
    bg: '#fee2e2',
    iconColor: '#dc2626',
    icon: '❗',
    href: '/administracion/alertas',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Fuentes de Financiamiento',
    subtitle: 'Gestionar fuentes',
    description: 'Administrar y agregar fuentes de financiamiento',
    bg: '#ffedd5',
    iconColor: '#ea580c',
    icon: '💲',
    href: '/administracion/fuentes-financiamiento',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Unidades Municipales',
    subtitle: 'Administrar unidades',
    description: 'Agregar y editar unidades municipales',
    bg: '#cffafe',
    iconColor: '#0891b2',
    icon: '🏢',
    href: '/administracion/unidades',
    permission: PERMISSIONS.administracionManage,
  },
  {
    title: 'Parámetros IA',
    subtitle: 'Alinear formulación',
    description: 'Definir visión del alcalde, PLADECO y lineamientos institucionales para la IA',
    bg: '#ede9fe',
    iconColor: '#7c3aed',
    icon: '🧠',
    href: '/administracion/parametros-ia',
    permission: PERMISSIONS.administracionManage,
  },
]

export default async function AdminCardGrid() {
  const supabase = await createClient()
  const authorization = await getAuthorization(supabase)
  const visibleModules = modules.filter((module) =>
    hasPermission(authorization, module.permission)
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 26,
      }}
    >
      {visibleModules.map((module) => (
        <AdminModuleCard
          key={module.title}
          title={module.title}
          subtitle={module.subtitle}
          description={module.description}
          bg={module.bg}
          iconColor={module.iconColor}
          icon={module.icon}
          href={module.href}
        />
      ))}
    </div>
  )
}

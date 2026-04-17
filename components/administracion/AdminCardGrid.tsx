import AdminModuleCard from './AdminModuleCard'

const modules = [
  {
    title: 'Creación de Usuarios',
    subtitle: 'Administrar usuarios',
    description: 'Crear, editar y eliminar usuarios del sistema',
    bg: '#dbeafe',
    iconColor: '#2563eb',
    icon: '👥',
    href: '/administracion/usuarios',
  },
  {
    title: 'Roles y Permisos',
    subtitle: 'Gestionar roles',
    description: 'Asignar y modificar roles y permisos',
    bg: '#dcfce7',
    iconColor: '#16a34a',
    icon: '🛡️',
    href: '/administracion/roles',
  },
  {
    title: 'Estados del Sistema',
    subtitle: 'Configurar estados',
    description: 'Definir los estados posibles de los proyectos',
    bg: '#f3e8ff',
    iconColor: '#9333ea',
    icon: '🔗',
    href: '/administracion/estados',
  },
  {
    title: 'Tipos de Alertas',
    subtitle: 'Configurar alertas',
    description: 'Definir y gestionar los tipos de alertas del sistema',
    bg: '#fee2e2',
    iconColor: '#dc2626',
    icon: '❗',
    href: '/administracion/alertas',
  },
  {
    title: 'Fuentes de Financiamiento',
    subtitle: 'Gestionar fuentes',
    description: 'Administrar y agregar fuentes de financiamiento',
    bg: '#ffedd5',
    iconColor: '#ea580c',
    icon: '💲',
    href: '/administracion/fuentes-financiamiento',
  },
  {
    title: 'Unidades Municipales',
    subtitle: 'Administrar unidades',
    description: 'Agregar y editar unidades municipales',
    bg: '#cffafe',
    iconColor: '#0891b2',
    icon: '🏢',
    href: '/administracion/unidades',
  },
]

export default function AdminCardGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 26,
      }}
    >
      {modules.map((module) => (
        <AdminModuleCard key={module.title} {...module} />
      ))}
    </div>
  )
}
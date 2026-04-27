import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Building2,
} from 'lucide-react'
import { createClient } from '../lib/supabase-server'
import { loadActiveSystemAlertCount } from '../lib/system-alerts'
import { getAuthorization, hasPermission, PERMISSIONS } from '../lib/auth-guards'
import LogoutButton from './LogoutButton'
import FontFamilySelector from './FontFamilySelector'
import ThemePaletteSelector from './ThemePaletteSelector'
import TopProjectSearch from './TopProjectSearch'

type AppShellProps = {
  title: string
  children: ReactNode
  currentModule?: string
  showTitle?: boolean
}

const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.dashboardView,
  },
  {
    key: 'cartera-proyectos',
    label: 'Cartera de Proyectos',
    href: '/cartera-proyectos',
    icon: FolderKanban,
    permission: [
      PERMISSIONS.proyectosView,
      PERMISSIONS.ejecucionView,
      PERMISSIONS.financiamientoView,
      PERMISSIONS.rendicionesView,
      PERMISSIONS.garantiasView,
      PERMISSIONS.proveedoresView,
      PERMISSIONS.bitacoraView,
      PERMISSIONS.historialView,
    ],
  },
  {
    key: 'creacion-formulacion',
    label: 'Creación y Formulación',
    href: '/creacion-formulacion',
    icon: Briefcase,
    permission: [
      PERMISSIONS.proyectosView,
      PERMISSIONS.proyectosCreate,
      PERMISSIONS.proyectosEdit,
      PERMISSIONS.proyectosApprove,
    ],
  },
  {
    key: 'alertas',
    label: 'Alertas',
    href: '/alertas',
    icon: ShieldAlert,
    permission: PERMISSIONS.alertasView,
  },
  {
    key: 'administracion',
    label: 'Administración',
    href: '/administracion',
    icon: Settings,
    permission: PERMISSIONS.administracionView,
  },
]

export default async function AppShell({
  title,
  children,
  currentModule,
  showTitle = false,
}: AppShellProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let nombreUsuario = 'Usuario'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre_completo, email')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.nombre_completo) {
      nombreUsuario = profile.nombre_completo
    } else if (user.email) {
      nombreUsuario = user.email
    }
  }

  const iniciales = nombreUsuario
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const authorization = await getAuthorization(supabase)
  const visibleMenuItems = menuItems.filter((item) =>
    hasPermission(authorization, item.permission)
  )
  const canViewAlerts = hasPermission(authorization, PERMISSIONS.alertasView)
  const { count: alertasActivas } = canViewAlerts
    ? await loadActiveSystemAlertCount(supabase)
    : { count: 0 }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        background: 'var(--app-bg)',
        fontFamily: 'var(--font-app)',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: 'var(--surface-muted)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header sidebar */}
          <div
            style={{
              height: 92,
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 18px',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px var(--focus-ring)',
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: 22 }}>
                C
              </span>
            </div>

            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-strong)',
                  lineHeight: 1.1,
                }}
              >
                Municipalidad
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: 'var(--text-muted)',
                }}
              >
                Curacautín
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav style={{ padding: '22px 14px 0 14px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {visibleMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentModule === item.key
                const badge = item.key === 'alertas' ? alertasActivas : 0

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        height: 46,
                        borderRadius: 12,
                        padding: '0 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isActive ? 'var(--primary-soft)' : 'transparent',
                        color: isActive ? 'var(--primary)' : 'var(--text)',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <Icon size={19} />
                        <span style={{ fontSize: 15 }}>{item.label}</span>
                      </div>

                      {badge > 0 && (
                        <div
                          style={{
                            minWidth: 22,
                            height: 22,
                            borderRadius: 999,
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                          }}
                        >
                          {badge}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Help box */}
        <div style={{ padding: 16 }}>
          <div
            style={{
              background: 'var(--primary-tint)',
              border: '1px solid var(--primary-soft)',
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>?</span>
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-strong)',
                marginBottom: 4,
              }}
            >
              Centro de ayuda
            </div>

            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              ¿Necesitas asistencia?
            </div>

            <div
              style={{
                fontSize: 14,
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              Ver más →
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* TOPBAR */}
        <header
          style={{
            height: 68,
            background: 'var(--primary-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px 0 22px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minWidth: 260,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'var(--surface-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={22} color="var(--primary-strong)" />
            </div>

            <div style={{ color: 'white', lineHeight: 1.15 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                Sistema de Gestión
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Proyectos Municipales
              </div>
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              padding: '0 24px',
            }}
          >
            <TopProjectSearch />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: 'white',
            }}
          >
            <FontFamilySelector />
            <ThemePaletteSelector />

            <div
              style={{
                width: 1,
                height: 28,
                background: 'rgba(255,255,255,0.2)',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: 'var(--surface-muted)',
                  color: 'var(--primary-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {iniciales}
              </div>

              <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
                {nombreUsuario.split(' ')[0] || 'Usuario'}
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        {/* CONTENT */}
        <main
          style={{
            padding: '26px 32px 32px 32px',
            background: 'var(--app-bg)',
            minHeight: 'calc(100vh - 68px)',
          }}
        >
          {showTitle && (
            <div style={{ marginBottom: 22 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  color: 'var(--text-strong)',
                }}
              >
                {title}
              </h1>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  )
}

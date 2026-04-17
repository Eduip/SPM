import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Bell,
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  Search,
  Settings,
  ShieldAlert,
  MessageSquare,
  Building2,
} from 'lucide-react'
import { createClient } from '../lib/supabase-server'
import LogoutButton from './LogoutButton'

type AppShellProps = {
  title: string
  children: ReactNode
  currentModule?: string
}

const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'cartera-proyectos',
    label: 'Cartera de Proyectos',
    href: '/cartera-proyectos',
    icon: FolderKanban,
  },
  {
    key: 'creacion-formulacion',
    label: 'Creación y Formulación',
    href: '/creacion-formulacion',
    icon: Briefcase,
  },
  {
    key: 'alertas',
    label: 'Alertas',
    href: '/alertas',
    icon: ShieldAlert,
    badge: 5,
  },
  {
    key: 'administracion',
    label: 'Administración',
    href: '/administracion',
    icon: Settings,
  },
]

export default async function AppShell({
  title,
  children,
  currentModule,
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        background: '#f3f4f6',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          background: '#f8fafc',
          borderRight: '1px solid #e5e7eb',
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
              borderBottom: '1px solid #e5e7eb',
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
                background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px rgba(37, 99, 235, 0.22)',
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
                  color: '#111827',
                  lineHeight: 1.1,
                }}
              >
                Municipalidad
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: '#6b7280',
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
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentModule === item.key

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
                        background: isActive ? '#dbeafe' : 'transparent',
                        color: isActive ? '#2563eb' : '#374151',
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

                      {item.badge && (
                        <div
                          style={{
                            minWidth: 22,
                            height: 22,
                            borderRadius: 999,
                            background: '#e11d48',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                          }}
                        >
                          {item.badge}
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
              background: '#eaf2ff',
              border: '1px solid #dbeafe',
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <span style={{ color: '#2563eb', fontWeight: 700 }}>?</span>
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: 4,
              }}
            >
              Centro de ayuda
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              ¿Necesitas asistencia?
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#2563eb',
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
            background: '#1f5fbf',
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
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={22} color="#1f5fbf" />
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
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                height: 40,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 16px',
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              <Search size={18} />
              <span style={{ fontSize: 15 }}>Buscar proyecto...</span>
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              color: 'white',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Bell size={19} />
              <div
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -5,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#ef4444',
                }}
              />
            </div>

            <MessageSquare size={19} />
            <Settings size={19} />

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
                  background: '#f8fafc',
                  color: '#1f5fbf',
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
            background: '#f3f4f6',
            minHeight: 'calc(100vh - 68px)',
          }}
        >
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 10,
              }}
            >
              {title}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              {title}
            </h1>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}

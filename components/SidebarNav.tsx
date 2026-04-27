'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  BriefcaseBusiness,
  FilePenLine,
  HelpCircle,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

const items = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Cartera de Proyectos',
    href: '/cartera-proyectos',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Creación y Formulación',
    href: '/creacion-formulacion',
    icon: FilePenLine,
  },
  { label: 'Alertas', href: '/alertas', icon: Bell, badge: '5' },
  { label: 'Administración', href: '/administracion', icon: Settings },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 92,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 22px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 24,
            boxShadow: '0 8px 16px rgba(37,99,235,0.2)',
          }}
        >
          C
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
              marginTop: 4,
              fontSize: 14,
              color: '#6b7280',
            }}
          >
            Curacautín
          </div>
        </div>
      </div>

      <nav
        style={{
          padding: '24px 12px 0 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                height: 46,
                borderRadius: 14,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: active ? '#e8f0ff' : 'transparent',
                color: active ? '#2563eb' : '#374151',
                fontWeight: active ? 700 : 500,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 15,
                }}
              >
                <Icon size={19} />
                {item.label}
              </span>

              {item.badge && (
                <span
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: 999,
                    background: '#e11d48',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 8px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 16 }}>
        <div
          style={{
            borderRadius: 16,
            background: '#eff6ff',
            border: '1px solid #dbeafe',
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={18} color="#2563eb" />
            </div>
            <div style={{ fontWeight: 700, color: '#1f2937', fontSize: 15 }}>
              Centro de ayuda
            </div>
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.5,
            }}
          >
            ¿Necesitas
            <br />
            asistencia?
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 14,
              color: 'var(--primary)',
              fontWeight: 700,
            }}
          >
            Ver más →
          </div>
        </div>
      </div>
    </div>
  )
}
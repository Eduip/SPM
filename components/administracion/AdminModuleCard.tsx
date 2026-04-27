'use client'

import { useRouter } from 'next/navigation'

export default function AdminModuleCard({
  title,
  subtitle,
  description,
  bg,
  iconColor,
  icon,
  href,
}: {
  title: string
  subtitle: string
  description: string
  bg: string
  iconColor: string
  icon: string
  href: string
}) {
  const router = useRouter()

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #e5e7eb',
        padding: 28,
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 20,
          background: bg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 28,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--text-strong)',
          lineHeight: 1.2,
          marginBottom: 20,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#374151',
          marginBottom: 10,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          fontSize: 16,
          color: '#6b7280',
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {description}
      </div>

      <button
        onClick={() => router.push(href)}
        style={{
          marginTop: 24,
          height: 52,
          borderRadius: 14,
          border: 'none',
          background: 'var(--primary)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 10px 18px rgba(37, 99, 235, 0.18)',
        }}
      >
        ⚙️ Configurar
      </button>
    </div>
  )
}
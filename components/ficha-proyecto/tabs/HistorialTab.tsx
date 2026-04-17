'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HistorialEvento, ProyectoFicha } from '../../../lib/project-types'

export default function HistorialTab({
  proyecto,
  historial,
}: {
  proyecto: ProyectoFicha
  historial: HistorialEvento[]
}) {
 
    const [search, setSearch] = useState('')
    const router = useRouter()
  
  

  const historialFiltrado = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return historial

    return historial.filter((item) => {
      const text = [
        item.accion,
        item.descripcion,
        JSON.stringify(item.metadata ?? {}),
      ]
        .join(' ')
        .toLowerCase()

      return text.includes(q)
    })
  }, [historial, search])

  const totalEventos = historial.length
  const totalHoy = historial.filter((h) => isToday(h.created_at)).length
  const diasActivos = new Set(
    historial.map((h) => new Date(h.created_at).toDateString())
  ).size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          borderRadius: 16,
          border: '1px solid #fde68a',
          background: '#fffbeb',
          color: '#92400e',
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {totalEventos} registros de actividad en este proyecto
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            Última actualización {historial[0]?.created_at ? formatRelative(historial[0].created_at) : 'sin registros'}
          </div>
        </div>

        <div
          style={{
            borderRadius: 12,
            background: '#fef3c7',
            color: '#a16207',
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Actividad del proyecto
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        <MetricCard
          title="Total de Eventos"
          value={String(totalEventos)}
          subtitle="registros acumulados"
          color="#2563eb"
          bg="#eff6ff"
        />
        <MetricCard
          title="Eventos Hoy"
          value={String(totalHoy)}
          subtitle="actividad del día"
          color="#16a34a"
          bg="#ecfdf5"
        />
        <MetricCard
          title="Días Activos"
          value={String(diasActivos)}
          subtitle="con movimiento registrado"
          color="#9333ea"
          bg="#faf5ff"
        />
        <MetricCard
          title="Usuarios Participantes"
          value={String(countDistinctUsers(historial))}
          subtitle="usuarios detectados"
          color="#ca8a04"
          bg="#fefce8"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 18,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en el historial..."
                style={{
                  flex: 1,
                  minWidth: 220,
                  height: 42,
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  padding: '0 14px',
                  fontSize: 14,
                  background: '#ffffff',
                }}
              />

              <button style={secondaryButtonStyle}>Filtros</button>
              <button style={secondaryButtonStyle}>Exportar</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <Tag text="Últimos 30 días" bg="#dbeafe" color="#2563eb" />
              <Tag text="Todos los usuarios" bg="#dcfce7" color="#16a34a" />
            </div>

            <div>
              <h3 style={titleStyle}>Historial de Actividad</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {historialFiltrado.length === 0 ? (
                  <div
                    style={{
                      borderRadius: 16,
                      border: '1px solid #e5e7eb',
                      padding: 18,
                      fontSize: 14,
                      color: '#6b7280',
                      background: '#ffffff',
                    }}
                  >
                    No hay eventos para mostrar.
                  </div>
                ) : (
                    historialFiltrado.map((item) => (
                        <HistorialItem
                          key={item.id}
                          item={item}
                          onDetail={() =>
                            router.push(`/cartera-proyectos/${proyecto.id}/historial/${item.id}`)
                          }
                        />
                      ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SideCard title="Alertas Activas">
            <AlertLine text="Boleta de garantía por vencer" color="#dc2626" />
            <AlertLine text="Renovación pendiente" color="#ca8a04" />
          </SideCard>

          <SideCard title="Métricas de Actividad">
            <MiniMetric label="Actividad Diaria" value={String(totalHoy)} subtitle="eventos hoy" />
            <MiniMetric label="Usuarios Activos" value={String(countDistinctUsers(historial))} subtitle="con registros" />
            <MiniMetric label="Última Acción" value={historial[0] ? formatDate(historial[0].created_at) : '-'} subtitle="evento más reciente" />
          </SideCard>
        </div>
      </div>
    </div>
  )
}

function HistorialItem({
    item,
    onDetail,
  }: {
    item: HistorialEvento
    onDetail: () => void
  }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 16,
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          ✓
        </div>

        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 4,
            }}
          >
            {humanizeAction(item.accion)}
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
              marginBottom: 6,
            }}
          >
            {formatDate(item.created_at)}
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#4b5563',
              lineHeight: 1.6,
            }}
          >
            {item.descripcion ?? 'Sin descripción'}
          </div>
        </div>
      </div>

      <button onClick={onDetail} style={detailButtonStyle}>
  Detalles
</button>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
  bg,
}: {
  title: string
  value: string
  subtitle: string
  color: string
  bg: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: 20,
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        •
      </div>

      <div style={{ fontSize: 34, fontWeight: 800, color: '#111827' }}>
        {value}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 8 }}>
        {title}
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  )
}

function SideCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function AlertLine({
  text,
  color,
}: {
  text: string
  color: string
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        padding: '14px 16px',
        background: '#ffffff',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontSize: 14,
          color: '#374151',
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  )
}

function MiniMetric({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle: string
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        padding: '14px 16px',
        background: '#ffffff',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>
    </div>
  )
}

function Tag({
  text,
  bg,
  color,
}: {
  text: string
  bg: string
  color: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  )
}

function humanizeAction(action?: string | null) {
  if (!action) return 'Evento'
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function countDistinctUsers(historial: HistorialEvento[]) {
  return new Set(historial.map((h) => h.usuario_id).filter(Boolean)).size
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}

function formatRelative(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diff < 1) return 'hace menos de 1 hora'
  if (diff === 1) return 'hace 1 hora'
  if (diff < 24) return `hace ${diff} horas`
  return formatDate(dateString)
}

function isToday(dateString: string) {
  const d = new Date(dateString)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 20,
  padding: 24,
  border: '1px solid #e5e7eb',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 18,
  fontSize: 20,
  fontWeight: 700,
  color: '#111827',
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 42,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
}

const detailButtonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

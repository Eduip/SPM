'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  MessageSquare,
  Pencil,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react'
import type { AlertHistoryItem, AlertStatus, SystemAlert } from '../../lib/system-alerts'

type AlertasDashboardProps = {
  alerts: SystemAlert[]
}

export default function AlertasDashboard({ alerts }: AlertasDashboardProps) {
  const router = useRouter()
  const [descriptionFilter, setDescriptionFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [query, setQuery] = useState('')

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return alerts.filter((alert) => {
      const matchesDescription =
        descriptionFilter === 'todas' || alert.severidad === descriptionFilter
      const matchesStatus = statusFilter === 'todos' || alert.estado === statusFilter
      const matchesQuery =
        normalizedQuery.length === 0 ||
        alert.proyecto.toLowerCase().includes(normalizedQuery) ||
        alert.codigo.toLowerCase().includes(normalizedQuery) ||
        alert.descripcion.toLowerCase().includes(normalizedQuery)

      return matchesDescription && matchesStatus && matchesQuery
    })
  }, [alerts, descriptionFilter, statusFilter, query])

  const selectedAlert = filteredAlerts[0] ?? alerts[0]
  const statusOptions = Array.from(new Set(alerts.map((alert) => alert.estado)))

  const metrics = [
    {
      label: 'Alertas Totales',
      value: alerts.length,
      icon: Bell,
      color: 'var(--text-strong)',
      iconColor: 'var(--text-muted)',
      background: 'var(--surface)',
      border: 'var(--border)',
    },
    {
      label: 'Críticas',
      value: alerts.filter((alert) => alert.severidad === 'Crítica').length,
      icon: AlertCircle,
      color: '#991b1b',
      iconColor: '#ef4444',
      background: '#fff1f2',
      border: '#fecdd3',
    },
    {
      label: 'Advertencias',
      value: alerts.filter((alert) => alert.severidad === 'Advertencia').length,
      icon: AlertTriangle,
      color: '#92400e',
      iconColor: '#f59e0b',
      background: '#fffbeb',
      border: '#fde68a',
    },
    {
      label: 'Informativas',
      value: alerts.filter((alert) => alert.severidad === 'Informativa').length,
      icon: Info,
      color: 'var(--primary-dark)',
      iconColor: 'var(--primary)',
      background: 'var(--primary-tint)',
      border: 'var(--primary-soft)',
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={pageTitleStyle}>Gestión de Alertas</h2>
        <p style={pageSubtitleStyle}>Monitoreo y control de eventos críticos en proyectos municipales</p>
      </div>

      <section style={metricGridStyle}>
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              key={metric.label}
              style={{
                ...metricCardStyle,
                background: metric.background,
                borderColor: metric.border,
              }}
            >
              <div style={metricIconWrapStyle}>
                <Icon size={22} color={metric.iconColor} />
              </div>
              <div style={{ fontSize: 34, fontWeight: 850, color: metric.color, lineHeight: 1 }}>
                {metric.value}
              </div>
              <div style={metricLabelStyle}>{metric.label}</div>
            </article>
          )
        })}
      </section>

      <div style={contentGridStyle}>
        <section style={{ minWidth: 0 }}>
          <div style={filterBarStyle}>
            <select
              value={descriptionFilter}
              onChange={(event) => setDescriptionFilter(event.target.value)}
              style={selectStyle}
              aria-label="Filtrar por tipo de alerta"
            >
              <option value="todas">Descripción</option>
              <option value="Crítica">Críticas</option>
              <option value="Advertencia">Advertencias</option>
              <option value="Informativa">Informativas</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={selectStyle}
              aria-label="Filtrar por estado"
            >
              <option value="todos">Estado</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <label style={searchWrapStyle}>
              <Search size={18} color="#94a3b8" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por proyecto o descripción..."
                style={searchInputStyle}
              />
            </label>
          </div>

          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>Proyecto</div>
              <div>Descripción</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div style={emptyStateStyle}>No hay alertas que coincidan con los filtros.</div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    ...tableRowStyle,
                    background: selectedAlert?.id === alert.id ? 'var(--primary-tint)' : 'var(--surface)',
                  }}
                >
                  <div>
                    <div style={projectNameStyle}>{alert.proyecto}</div>
                    <div style={projectCodeStyle}>{alert.codigo}</div>
                  </div>
                  <div style={descriptionStyle}>{alert.descripcion}</div>
                  <div>
                    <span style={statusBadgeStyle(alert.estado)}>{alert.estado}</span>
                  </div>
                  <div style={actionsStyle}>
                    <button
                      type="button"
                      onClick={() => router.push(`/cartera-proyectos/${alert.proyectoId}`)}
                      style={iconButtonStyle('var(--success)')}
                      title="Abrir proyecto"
                      aria-label="Abrir proyecto"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/administracion/alertas')}
                      style={iconButtonStyle('var(--text-muted)')}
                      title="Editar reglas"
                      aria-label="Editar reglas"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}

            <div style={paginationStyle}>
              <span style={paginationTextStyle}>
                Mostrando {filteredAlerts.length === 0 ? 0 : 1}-{filteredAlerts.length} de {alerts.length} alertas
              </span>
              <div style={paginationButtonsStyle}>
                <button type="button" style={pageButtonStyle}>
                  <ChevronLeft size={15} />
                  Anterior
                </button>
                <button type="button" style={activePageButtonStyle}>1</button>
                <button type="button" style={numberPageButtonStyle}>2</button>
                <button type="button" style={numberPageButtonStyle}>3</button>
                <button type="button" style={pageButtonStyle}>
                  Siguiente
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside style={historyPanelStyle}>
          <div style={{ marginBottom: 22 }}>
            <h3 style={historyTitleStyle}>Historial de Alerta</h3>
            <div style={historySubtitleStyle}>
              {selectedAlert?.descripcion ?? 'Último evento registrado'}
            </div>
          </div>

          {!selectedAlert ? (
            <div style={emptyHistoryStyle}>Seleccione una alerta para ver su historial.</div>
          ) : (
            <div style={timelineStyle}>
              {selectedAlert.history.map((item) => {
                const Icon = getHistoryIcon(item.tone)

                return (
                  <div key={item.id} style={timelineItemStyle}>
                    <div style={timelineIconStyle(item.tone)}>
                      <Icon size={16} />
                    </div>

                    <article style={historyCardStyle}>
                      <div style={historyCardHeaderStyle}>
                        <strong style={{ color: 'var(--text-strong)' }}>{item.title}</strong>
                        <span style={historyDateStyle}>
                          {item.date}
                          <br />
                          {item.time}
                        </span>
                      </div>
                      <p style={historyDescriptionStyle}>{item.description}</p>
                      <div style={historyUserStyle}>{item.user}</div>
                    </article>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.12,
  color: 'var(--text-strong)',
  fontWeight: 850,
}

const pageSubtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--text-muted)',
  fontSize: 16,
  lineHeight: 1.45,
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))',
  gap: 18,
  marginBottom: 22,
}

const metricCardStyle: React.CSSProperties = {
  minHeight: 142,
  border: '1px solid',
  borderRadius: 8,
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}

const metricIconWrapStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.72)',
}

const metricLabelStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontSize: 14,
  fontWeight: 800,
}

const contentGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 320px',
  gap: 22,
  alignItems: 'start',
}

const filterBarStyle: React.CSSProperties = {
  minHeight: 74,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 16,
  display: 'grid',
  gridTemplateColumns: '180px 180px minmax(240px, 1fr)',
  gap: 14,
  alignItems: 'center',
  marginBottom: 18,
}

const selectStyle: React.CSSProperties = {
  height: 42,
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 14px',
  color: 'var(--text-muted)',
  background: 'var(--surface)',
  fontSize: 14,
  fontWeight: 650,
  outline: 'none',
}

const searchWrapStyle: React.CSSProperties = {
  height: 42,
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}

const searchInputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  width: '100%',
  color: 'var(--text-strong)',
  fontSize: 14,
  fontWeight: 600,
  background: 'transparent',
}

const tableCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.35fr 1.1fr 126px 122px',
  gap: 18,
  padding: '18px 22px',
  background: 'var(--surface-muted)',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: 0,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.35fr 1.1fr 126px 122px',
  gap: 18,
  padding: '20px 22px',
  alignItems: 'center',
  borderBottom: '1px solid var(--border)',
}

const projectNameStyle: React.CSSProperties = {
  color: 'var(--text-strong)',
  fontWeight: 850,
  fontSize: 14,
  lineHeight: 1.25,
}

const projectCodeStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 700,
  marginTop: 4,
}

const descriptionStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.35,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}

const emptyStateStyle: React.CSSProperties = {
  padding: 28,
  color: 'var(--text-muted)',
  fontSize: 15,
  fontWeight: 650,
}

const paginationStyle: React.CSSProperties = {
  minHeight: 62,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 18px',
}

const paginationTextStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13,
  fontWeight: 650,
}

const paginationButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}

const pageButtonStyle: React.CSSProperties = {
  height: 34,
  border: '1px solid var(--border)',
  borderRadius: 7,
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  fontWeight: 800,
  padding: '0 10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  cursor: 'pointer',
}

const numberPageButtonStyle: React.CSSProperties = {
  ...pageButtonStyle,
  width: 34,
  padding: 0,
  justifyContent: 'center',
}

const activePageButtonStyle: React.CSSProperties = {
  ...numberPageButtonStyle,
  borderColor: 'var(--primary)',
  background: 'var(--primary)',
  color: 'var(--primary-contrast)',
}

const historyPanelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 22,
}

const historyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-strong)',
  fontSize: 18,
  fontWeight: 850,
}

const historySubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: 'var(--text-muted)',
  fontSize: 13,
  fontWeight: 700,
}

const timelineStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
}

const timelineItemStyle: React.CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 12,
}

const historyCardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface-muted)',
  padding: 14,
}

const historyCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 13,
  lineHeight: 1.2,
}

const historyDateStyle: React.CSSProperties = {
  color: 'var(--text-soft)',
  fontSize: 11,
  fontWeight: 800,
  textAlign: 'right',
  lineHeight: 1.25,
}

const historyDescriptionStyle: React.CSSProperties = {
  margin: '10px 0 12px',
  color: 'var(--text-muted)',
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 650,
}

const historyUserStyle: React.CSSProperties = {
  color: 'var(--primary)',
  fontSize: 12,
  fontWeight: 850,
}

const emptyHistoryStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
  fontWeight: 650,
  lineHeight: 1.5,
}

function statusBadgeStyle(status: AlertStatus): React.CSSProperties {
  const palette = {
    Activa: { bg: '#fee2e2', color: 'var(--danger)', border: '#fecaca' },
    'En Proceso': { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
    Resuelta: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    Vigente: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    'Por vencer': { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
    Vencido: { bg: '#fee2e2', color: 'var(--danger)', border: '#fecaca' },
    'Pendiente de pago': { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
    Pagado: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    'En revisión': { bg: '#dbeafe', color: 'var(--primary)', border: 'var(--primary-soft)' },
    Observada: { bg: '#fee2e2', color: 'var(--danger)', border: '#fecaca' },
    Rendido: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    'Sin estado': { bg: '#f1f5f9', color: 'var(--text-muted)', border: '#e2e8f0' },
  }[status]

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.color,
    fontSize: 12,
    fontWeight: 850,
    padding: '0 10px',
  }
}

function iconButtonStyle(background: string): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    border: 'none',
    borderRadius: 7,
    background,
    color: 'var(--surface)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
}

function timelineIconStyle(tone: AlertHistoryItem['tone']): React.CSSProperties {
  const palette: Record<AlertHistoryItem['tone'], { bg: string; color: string; border: string }> = {
    info: { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
    purple: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    green: { bg: '#ecfdf5', color: 'var(--success)', border: '#bbf7d0' },
    orange: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  }

  const selected = palette[tone]

  return {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${selected.border}`,
    background: selected.bg,
    color: selected.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  }
}

function getHistoryIcon(tone: AlertHistoryItem['tone']) {
  if (tone === 'purple') return UserCheck
  if (tone === 'green') return MessageSquare
  if (tone === 'orange') return RefreshCw
  return Info
}

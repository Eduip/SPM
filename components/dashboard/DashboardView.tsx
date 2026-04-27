'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { SystemAlert } from '../../lib/system-alerts'

export type DashboardProjectItem = {
  id: string
  codigo_interno: string | null
  nombre: string | null
  estado: string | null
  monto_estimado: number | string | null
  presupuesto_total: number | null
  porcentaje_formulacion: number | string | null
  avance_fisico_actual: number | string | null
  avance_financiero_actual: number | string | null
  created_at: string | null
  anio_inicio?: number | string | null
  fuenteNombre: string
}

export type DashboardEstadoPagoItem = {
  proyecto_id: string
  monto?: number | string | null
  avance_fisico?: number | string | null
  estado?: string | null
}

export type DashboardRendicionItem = {
  proyecto_id: string
  monto_rendido?: number | string | null
  estado?: string | null
}

export type DashboardGarantiaItem = {
  proyecto_id: string
  fecha_vencimiento?: string | null
  estado?: string | null
}

export type DashboardAlertItem = SystemAlert

type DashboardViewProps = {
  projects: DashboardProjectItem[]
  estadosPago: DashboardEstadoPagoItem[]
  rendiciones: DashboardRendicionItem[]
  garantias: DashboardGarantiaItem[]
  alerts: DashboardAlertItem[]
}

export default function DashboardView({
  projects,
  estadosPago,
  rendiciones,
  garantias,
  alerts,
}: DashboardViewProps) {
  const [yearFilter, setYearFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [fuenteFilter, setFuenteFilter] = useState('todas')

  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => String(resolveProjectYear(project) || ''))
            .filter(Boolean)
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [projects]
  )

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => humanizeEstado(project.estado)))).sort(),
    [projects]
  )

  const fuenteOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.fuenteNombre || 'Sin fuente'))).sort(),
    [projects]
  )

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const projectYear = String(resolveProjectYear(project) || '')
        const humanStatus = humanizeEstado(project.estado)

        const matchesYear = yearFilter === 'todos' || projectYear === yearFilter
        const matchesStatus = statusFilter === 'todos' || humanStatus === statusFilter
        const matchesFuente =
          fuenteFilter === 'todas' || project.fuenteNombre === fuenteFilter

        return matchesYear && matchesStatus && matchesFuente
      }),
    [projects, yearFilter, statusFilter, fuenteFilter]
  )

  const filteredProjectIds = useMemo(
    () => new Set(filteredProjects.map((project) => project.id)),
    [filteredProjects]
  )

  const filteredEstadosPago = useMemo(
    () => estadosPago.filter((item) => filteredProjectIds.has(item.proyecto_id)),
    [estadosPago, filteredProjectIds]
  )
  const filteredRendiciones = useMemo(
    () => rendiciones.filter((item) => filteredProjectIds.has(item.proyecto_id)),
    [rendiciones, filteredProjectIds]
  )
  const filteredGarantias = useMemo(
    () => garantias.filter((item) => filteredProjectIds.has(item.proyecto_id)),
    [garantias, filteredProjectIds]
  )
  const filteredAlerts = useMemo(
    () => alerts.filter((item) => filteredProjectIds.has(item.proyectoId)),
    [alerts, filteredProjectIds]
  )

  const totalPresupuestado = filteredProjects.reduce(
    (total, project) =>
      total + Number(project.presupuesto_total ?? project.monto_estimado ?? 0),
    0
  )
  const pagado = filteredEstadosPago
    .filter((item) => normalizeText(item.estado) === 'pagado')
    .reduce((total, item) => total + Number(item.monto ?? 0), 0)
  const rendido = filteredRendiciones
    .filter((item) => normalizeText(item.estado) === 'rendido')
    .reduce((total, item) => total + Number(item.monto_rendido ?? 0), 0)

  const averages = {
    formulacion: average(filteredProjects.map((project) => Number(project.porcentaje_formulacion ?? 0))),
    fisico: average(filteredProjects.map((project) => Number(project.avance_fisico_actual ?? 0))),
    financiero: average(filteredProjects.map((project) => Number(project.avance_financiero_actual ?? 0))),
  }

  const statusDistribution = buildStatusDistribution(filteredProjects)
  const fundingDistribution = buildFundingDistribution(filteredProjects)
  const monthlyProjects = buildMonthlyProjects(filteredProjects)
  const alertSeverityDistribution = buildAlertSeverityDistribution(filteredAlerts)

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--primary-tint) 65%, white 35%) 0%, var(--surface) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Dashboard Ejecutivo
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.06,
              color: 'var(--text-strong)',
              maxWidth: 780,
            }}
          >
            Seguimiento dinámico de proyectos municipales
          </h1>
          <p
            style={{
              margin: '14px 0 0 0',
              fontSize: 15,
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              maxWidth: 760,
            }}
          >
            Filtra la cartera y revisa cómo cambian los gráficos de formulación,
            ejecución, alertas y presupuesto en tiempo real.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 10,
            alignSelf: 'stretch',
          }}
        >
          <HeroStat label="Proyectos filtrados" value={String(filteredProjects.length)} />
          <HeroStat label="Presupuesto consolidado" value={formatCompactCurrency(totalPresupuestado)} />
          <HeroStat label="Alertas activas" value={String(filteredAlerts.length)} />
        </div>
      </section>

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 18,
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-strong)' }}>Filtros</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>
            Los gráficos se actualizan automáticamente
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          <FilterField
            label="Año"
            value={yearFilter}
            onChange={setYearFilter}
            options={[{ value: 'todos', label: 'Todos los años' }, ...yearOptions.map((year) => ({ value: year, label: year }))]}
          />
          <FilterField
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'todos', label: 'Todos los estados' }, ...statusOptions.map((status) => ({ value: status, label: status }))]}
          />
          <FilterField
            label="Fuente"
            value={fuenteFilter}
            onChange={setFuenteFilter}
            options={[{ value: 'todas', label: 'Todas las fuentes' }, ...fuenteOptions.map((fuente) => ({ value: fuente, label: fuente }))]}
          />
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <MetricCard label="Proyectos filtrados" value={String(filteredProjects.length)} tone="primary" />
        <MetricCard label="Presupuesto" value={formatCompactCurrency(totalPresupuestado)} tone="success" />
        <MetricCard label="Pagado" value={formatCompactCurrency(pagado)} tone="warning" />
        <MetricCard label="Alertas activas" value={String(filteredAlerts.length)} tone="danger" />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <Card title="Avance promedio">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 18,
              alignItems: 'end',
              minHeight: 260,
            }}
          >
            <VerticalBar label="Formulación" value={averages.formulacion} color="var(--primary)" />
            <VerticalBar label="Físico" value={averages.fisico} color="#15803d" />
            <VerticalBar label="Financiero" value={averages.financiero} color="#b45309" />
          </div>
        </Card>

        <Card title="Estados de proyectos">
          {statusDistribution.length === 0 ? (
            <EmptyState text="No hay proyectos para mostrar con los filtros actuales." />
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {statusDistribution.map((item) => (
                <HorizontalBar
                  key={item.label}
                  label={item.label}
                  value={item.count}
                  percentage={percentage(item.count, filteredProjects.length)}
                  color={item.color}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <Card title="Presupuesto por fuente">
          {fundingDistribution.length === 0 ? (
            <EmptyState text="No hay presupuesto disponible para los filtros actuales." />
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {fundingDistribution.map((item, index) => (
                <HorizontalBar
                  key={item.label}
                  label={item.label}
                  value={formatCompactCurrency(item.amount)}
                  percentage={percentage(item.amount, fundingDistribution[0]?.amount ?? 0)}
                  color={sourceColor(index)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card title="Severidad de alertas">
          {filteredAlerts.length === 0 ? (
            <EmptyState text="No hay alertas para los filtros actuales." />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '180px minmax(0, 1fr)',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <DonutChart data={alertSeverityDistribution} />
              <div style={{ display: 'grid', gap: 12 }}>
                {alertSeverityDistribution.map((item) => (
                  <LegendRow
                    key={item.label}
                    label={item.label}
                    value={String(item.value)}
                    color={item.color}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <Card title="Proyectos creados por mes">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'end',
              minHeight: 240,
            }}
          >
            {monthlyProjects.map((item) => (
              <MiniMonthBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={Math.max(...monthlyProjects.map((entry) => entry.value), 1)}
              />
            ))}
          </div>
        </Card>

        <Card title="Indicadores operativos">
          <div style={{ display: 'grid', gap: 14 }}>
            <IndicatorRow label="Estados de pago pendientes" value={String(filteredEstadosPago.filter((item) => normalizeText(item.estado) !== 'pagado').length)} />
            <IndicatorRow label="Rendiciones abiertas" value={String(filteredRendiciones.filter((item) => normalizeText(item.estado) !== 'rendido').length)} />
            <IndicatorRow label="Garantías por vencer" value={String(filteredGarantias.filter((item) => isGuaranteeNearExpiration(item.fecha_vencimiento)).length)} />
            <IndicatorRow label="Garantías vencidas" value={String(filteredGarantias.filter((item) => isGuaranteeExpired(item.fecha_vencimiento)).length)} />
            <IndicatorRow label="Monto rendido" value={formatCompactCurrency(rendido)} />
          </div>
        </Card>
      </section>

      <Card title="Proyectos recientes">
        {filteredProjects.length === 0 ? (
          <EmptyState text="No hay proyectos que coincidan con los filtros." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)' }}>
                <HeaderCell>Código</HeaderCell>
                <HeaderCell>Proyecto</HeaderCell>
                <HeaderCell>Fuente</HeaderCell>
                <HeaderCell>Estado</HeaderCell>
                <HeaderCell align="right">Presupuesto</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.slice(0, 8).map((project) => (
                <tr key={project.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <BodyCell>{project.codigo_interno || project.id.slice(0, 8)}</BodyCell>
                  <BodyCell strong>
                    <Link
                      href={`/cartera-proyectos/${project.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {project.nombre || 'Proyecto sin nombre'}
                    </Link>
                  </BodyCell>
                  <BodyCell>{project.fuenteNombre}</BodyCell>
                  <BodyCell>{humanizeEstado(project.estado)}</BodyCell>
                  <BodyCell align="right">
                    {formatCurrency(project.presupuesto_total ?? project.monto_estimado)}
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        style={{
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: 'var(--text-strong)' }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function FilterField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          height: 42,
          borderRadius: 12,
          border: '1px solid var(--border-strong)',
          background: 'var(--surface-muted)',
          padding: '0 12px',
          fontSize: 14,
          color: 'var(--text-strong)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const tones = {
    primary: ['var(--primary-soft)', 'var(--primary)'],
    success: ['#dcfce7', '#15803d'],
    warning: ['#fef3c7', '#b45309'],
    danger: ['#fee2e2', '#b91c1c'],
  } as const
  const [background, color] = tones[tone]

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 18,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 100,
          height: 4,
          borderRadius: 999,
          background,
          marginBottom: 16,
        }}
      />
      <div style={{ fontSize: 30, fontWeight: 850, color, lineHeight: 1.05, marginBottom: 10 }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</span>
      <strong style={{ fontSize: 18, color: 'var(--text-strong)' }}>{value}</strong>
    </div>
  )
}

function VerticalBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)' }}>{value}%</div>
      <div
        style={{
          width: '100%',
          maxWidth: 92,
          height: 180,
          borderRadius: 999,
          background: 'var(--surface-muted)',
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${value}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
    </div>
  )
}

function HorizontalBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string
  value: string | number
  percentage: number
  color: string
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{label}</span>
        <strong style={{ color: 'var(--text-strong)', fontSize: 14 }}>{value}</strong>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 999,
          background: 'var(--surface-muted)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}

function DonutChart({
  data,
}: {
  data: Array<{ label: string; value: number; color: string }>
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const gradient = total
    ? data
        .reduce(
          (acc, item) => {
            const start = acc.current
            const slice = (item.value / total) * 100
            acc.parts.push(`${item.color} ${start}% ${start + slice}%`)
            acc.current += slice
            return acc
          },
          { current: 0, parts: [] as string[] }
        )
        .parts.join(', ')
    : '#e5e7eb 0% 100%'

  return (
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: `conic-gradient(${gradient})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: '50%',
          background: '#fff',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-strong)' }}>{total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Alertas</div>
        </div>
      </div>
    </div>
  )
}

function LegendRow({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: color,
            display: 'inline-block',
          }}
        />
        <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{label}</span>
      </div>
      <strong style={{ color: 'var(--text-strong)', fontSize: 14 }}>{value}</strong>
    </div>
  )
}

function MiniMonthBar({
  label,
  value,
  maxValue,
}: {
  label: string
  value: number
  maxValue: number
}) {
  const height = maxValue > 0 ? Math.max(14, Math.round((value / maxValue) * 160)) : 14

  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div
        style={{
          width: '100%',
          minHeight: 170,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 52,
            height,
            borderRadius: 16,
            background: 'var(--primary)',
          }}
        />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
    </div>
  )
}

function IndicatorRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</span>
      <strong style={{ color: 'var(--text-strong)', fontSize: 15 }}>{value}</strong>
    </div>
  )
}

function HeaderCell({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      style={{
        padding: '14px 16px',
        color: 'var(--text-muted)',
        fontSize: 12,
        letterSpacing: 0,
        textAlign: align,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </th>
  )
}

function BodyCell({
  children,
  align = 'left',
  strong = false,
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  strong?: boolean
}) {
  return (
    <td
      style={{
        padding: '15px 16px',
        color: strong ? 'var(--text-strong)' : 'var(--text-muted)',
        fontSize: 14,
        fontWeight: strong ? 700 : 600,
        textAlign: align,
      }}
    >
      {children}
    </td>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{text}</div>
}

function formatCurrency(value?: number | string | null) {
  const numericValue = Number(value ?? 0)

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)
}

function humanizeEstado(value?: string | null) {
  if (!value) return 'Sin estado'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resolveProjectYear(project: DashboardProjectItem) {
  if (project.anio_inicio) return Number(project.anio_inicio)
  if (project.created_at) return new Date(project.created_at).getFullYear()
  return null
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

function percentage(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

function buildStatusDistribution(projects: DashboardProjectItem[]) {
  const map = new Map<string, number>()
  for (const project of projects) {
    const label = humanizeEstado(project.estado)
    map.set(label, (map.get(label) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .map(([label, count], index) => ({
      label,
      count,
      color: sourceColor(index),
    }))
    .sort((a, b) => b.count - a.count)
}

function buildFundingDistribution(projects: DashboardProjectItem[]) {
  const map = new Map<string, number>()
  for (const project of projects) {
    const key = project.fuenteNombre || 'Sin fuente'
    const amount = Number(project.presupuesto_total ?? project.monto_estimado ?? 0)
    map.set(key, (map.get(key) ?? 0) + amount)
  }

  return Array.from(map.entries())
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
}

function buildMonthlyProjects(projects: DashboardProjectItem[]) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString('es-CL', { month: 'short' }),
      value: 0,
    }
  })

  const map = new Map(months.map((item) => [item.key, item]))
  for (const project of projects) {
    if (!project.created_at) continue
    const date = new Date(project.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const current = map.get(key)
    if (current) current.value += 1
  }

  return months
}

function buildAlertSeverityDistribution(alerts: DashboardAlertItem[]) {
  const severities = [
    { label: 'Críticas', color: '#b91c1c' },
    { label: 'Advertencias', color: '#b45309' },
    { label: 'Informativas', color: 'var(--primary)' },
  ]

  return severities.map((item) => ({
    ...item,
    value: alerts.filter((alert) => {
      if (item.label === 'Críticas') return alert.severidad === 'Crítica'
      if (item.label === 'Advertencias') return alert.severidad === 'Advertencia'
      return alert.severidad === 'Informativa'
    }).length,
  }))
}

function sourceColor(index: number) {
  const colors = ['var(--primary)', '#15803d', '#b45309', '#7c3aed', '#0891b2', '#dc2626']
  return colors[index % colors.length]
}

function isGuaranteeNearExpiration(value?: string | null) {
  const days = diffInDays(value)
  return days !== null && days >= 0 && days < 30
}

function isGuaranteeExpired(value?: string | null) {
  const days = diffInDays(value)
  return days !== null && days < 0
}

function diffInDays(value?: string | null) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((target.getTime() - today.getTime()) / msPerDay)
}

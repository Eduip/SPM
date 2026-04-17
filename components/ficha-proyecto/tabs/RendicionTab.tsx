'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearRendicion } from '../../../app/cartera-proyectos/actions/rendiciones'
import type { EstadoPagoProyecto, ProyectoFicha, RendicionProyecto } from '../../../lib/project-types'

export default function RendicionTab({
  proyecto,
  estadosPago,
  rendiciones,
}: {
  proyecto: ProyectoFicha | null
  estadosPago: EstadoPagoProyecto[]
  rendiciones: RendicionProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  if (!proyecto) {
    return <div style={errorCardStyle}>No se pudo cargar la rendición del proyecto.</div>
  }

  const totalEstadosPago = estadosPago.reduce(
    (acc, ep) => acc + Number(ep.monto ?? 0),
    0
  )

  const totalRendido = rendiciones.reduce(
    (acc, r) => acc + Number(r.monto_rendido ?? 0),
    0
  )

  const saldoPorRendir = Math.max(totalEstadosPago - totalRendido, 0)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowForm(true)}
            style={primaryButtonStyle}
          >
            + Nueva rendición
          </button>
        </div>

        {showForm && (
          <form
            action={async (formData) => {
              formData.append('proyecto_id', proyecto.id)

              const res = await crearRendicion(formData)

              if (!res.success) {
                alert(res.error)
                return
              }

              setShowForm(false)
              router.refresh()
            }}
            style={formStyle}
          >
            <input
              name="numero_rendicion"
              type="number"
              placeholder="N° Rendición"
              required
              style={inputStyle}
            />

            <select name="estado_pago_id" style={inputStyle}>
              <option value="">Sin estado de pago asociado</option>
              {estadosPago.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  Estado de Pago N°{ep.numero}
                </option>
              ))}
            </select>

            <input
              name="fecha"
              type="date"
              required
              style={inputStyle}
            />

            <input
              name="monto_rendido"
              type="number"
              placeholder="Monto rendido"
              required
              style={inputStyle}
            />

            <input
              name="observacion"
              placeholder="Observación"
              style={inputStyle}
            />

            <button type="submit" style={submitStyle}>
              Guardar rendición
            </button>
          </form>
        )}

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div>
              <div style={labelStyle}>Total Rendido</div>
              <div style={valueStyle}>
                CLP {formatCurrency(totalRendido)} / CLP {formatCurrency(totalEstadosPago)}
              </div>
              <div style={subStyle}>
                {totalEstadosPago > 0
                  ? `${Math.round((totalRendido / totalEstadosPago) * 100)}% de los estados de pago rendido`
                  : 'Sin estados de pago asociados'}
              </div>
            </div>

            <div style={badgeStyle}>
              {totalEstadosPago > 0
                ? `${Math.round((totalRendido / totalEstadosPago) * 100)}%`
                : '0%'}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={tableHeaderStyle}>
            <div>Rendición</div>
            <div>Fecha</div>
            <div>Monto</div>
            <div>Estado</div>
            <div>Asociación</div>
          </div>

          {rendiciones.length === 0 ? (
            <div
              style={{
                padding: 20,
                borderTop: '1px solid #e5e7eb',
                fontSize: 14,
                color: '#6b7280',
              }}
            >
              Aún no hay rendiciones registradas.
            </div>
          ) : (
            rendiciones.map((r) => {
              const estadoPago = estadosPago.find((ep) => ep.id === r.estado_pago_id)

              return (
                <div key={r.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827' }}>
                      Rendición N°{r.numero_rendicion}
                    </div>
                    <div style={subStyle}>{r.observacion || 'Sin observación'}</div>
                  </div>

                  <div style={cellStyle}>
                    {r.fecha ? formatDate(r.fecha) : '-'}
                  </div>

                  <div style={cellStyle}>
                    CLP {formatCurrency(Number(r.monto_rendido ?? 0))}
                  </div>

                  <EstadoRendicionBadge estado={r.estado} />

                  <div style={cellStyle}>
                    {estadoPago ? `EP N°${estadoPago.numero}` : 'Sin asociación'}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>Resumen Rendición</h3>

          <MetricCard
            label="Rendiciones registradas"
            value={String(rendiciones.length)}
            subtitle="Total de registros"
            color="#2563eb"
            bg="#eff6ff"
          />

          <MetricCard
            label="Total rendido"
            value={`CLP ${formatCurrency(totalRendido)}`}
            subtitle="Monto acumulado"
            color="#16a34a"
            bg="#ecfdf5"
          />

          <MetricCard
            label="Saldo por rendir"
            value={`CLP ${formatCurrency(saldoPorRendir)}`}
            subtitle="Pendiente de rendición"
            color="#ea580c"
            bg="#fff7ed"
          />
        </div>
      </div>
    </div>
  )
}

function EstadoRendicionBadge({ estado }: { estado?: string | null }) {
  const normalized = (estado ?? 'pendiente_revision').toLowerCase()

  const config =
    normalized === 'aprobada'
      ? { label: 'Aprobada', bg: '#dcfce7', color: '#16a34a' }
      : normalized === 'rechazada'
      ? { label: 'Rechazada', bg: '#fee2e2', color: '#dc2626' }
      : { label: 'Pendiente revisión', bg: '#fef3c7', color: '#ca8a04' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {config.label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  color,
  bg,
}: {
  label: string
  value: string
  subtitle: string
  color: string
  bg: string
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: bg,
        border: '1px solid #e5e7eb',
        marginTop: 12,
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280' }}>
        {subtitle}
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL').format(value)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}

const errorCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 20,
  border: '1px solid #fecaca',
  color: '#b91c1c',
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

const primaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto',
  gap: 12,
  padding: 16,
  borderRadius: 16,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
}

const inputStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  padding: '0 12px',
  fontSize: 14,
  background: '#ffffff',
  color: '#111827',
  boxSizing: 'border-box',
}

const submitStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 14px',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#2563eb',
  fontWeight: 700,
  marginBottom: 8,
}

const valueStyle: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  color: '#1e3a8a',
  marginBottom: 6,
}

const subStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
}

const badgeStyle: React.CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: 16,
  border: '2px solid #93c5fd',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 800,
  color: '#1d4ed8',
  flexShrink: 0,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
  gap: 12,
  padding: '14px 16px',
  background: '#f9fafb',
  fontSize: 12,
  fontWeight: 800,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 14,
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
  gap: 12,
  padding: '16px',
  borderTop: '1px solid #e5e7eb',
  alignItems: 'center',
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
}

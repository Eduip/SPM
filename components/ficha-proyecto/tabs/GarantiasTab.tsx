'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearGarantia } from '../../../app/cartera-proyectos/actions/garantias'
import type { GarantiaProyecto, ProyectoFicha } from '../../../lib/project-types'

export default function GarantiasTab({
  proyecto,
  garantias,
}: {
  proyecto: ProyectoFicha | null
  garantias: GarantiaProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  if (!proyecto) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: 20,
          border: '1px solid #fecaca',
          color: '#b91c1c',
        }}
      >
        No se pudo cargar la información de garantías del proyecto.
      </div>
    )
  }

  const vigentes = garantias.filter((g) => g.estado === 'vigente').length
  const porVencer = garantias.filter((g) => diasParaVencer(g.fecha_vencimiento) <= 30 && diasParaVencer(g.fecha_vencimiento) >= 0).length
  const vencidas = garantias.filter((g) => diasParaVencer(g.fecha_vencimiento) < 0).length

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
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <h3 style={titleStyle}>Garantías del Proyecto</h3>

            <button
              onClick={() => setShowForm(true)}
              style={primaryButtonStyle}
            >
              Nueva garantía
            </button>
          </div>

          {showForm && (
            <form
              action={async (formData) => {
                formData.append('proyecto_id', proyecto.id)

                const res = await crearGarantia(formData)

                if (!res.success) {
                  alert(res.error)
                  return
                }

                setShowForm(false)
                router.refresh()
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 20,
                padding: 16,
                borderRadius: 16,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}
            >
              <input name="tipo" placeholder="Tipo" required style={inputStyle} />
              <input name="numero_documento" placeholder="Número documento" required style={inputStyle} />
              <input name="emisor" placeholder="Emisor" style={inputStyle} />
              <input name="monto" type="number" placeholder="Monto" required style={inputStyle} />
              <input name="fecha_emision" type="date" style={inputStyle} />
              <input name="fecha_vencimiento" type="date" required style={inputStyle} />
              <input
                name="observacion"
                placeholder="Observación"
                style={{ ...inputStyle, gridColumn: '1 / -1' }}
              />
              <button type="submit" style={{ ...submitStyle, gridColumn: '1 / -1' }}>
                Guardar garantía
              </button>
            </form>
          )}

          <div
            style={{
              borderRadius: 18,
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                gap: 12,
                padding: '14px 16px',
                background: '#f9fafb',
                fontSize: 12,
                fontWeight: 800,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <div>Tipo</div>
              <div>Número</div>
              <div>Emisor</div>
              <div>Monto</div>
              <div>Vencimiento</div>
              <div>Estado</div>
            </div>

            {garantias.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  borderTop: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#6b7280',
                }}
              >
                Aún no hay garantías registradas.
              </div>
            ) : (
              garantias.map((g) => (
                <GarantiaRow key={g.id} garantia={g} />
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>Estado de Garantías</h3>

          <MetricCard
            label="Vigentes"
            value={String(vigentes)}
            subtitle="Garantías activas"
            color="#16a34a"
            bg="#ecfdf5"
          />

          <MetricCard
            label="Por vencer"
            value={String(porVencer)}
            subtitle="Dentro de 30 días"
            color="#ca8a04"
            bg="#fefce8"
          />

          <MetricCard
            label="Vencidas"
            value={String(vencidas)}
            subtitle="Requieren revisión"
            color="#dc2626"
            bg="#fef2f2"
          />
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>Observaciones</h3>
          <div
            style={{
              fontSize: 14,
              color: '#4b5563',
              lineHeight: 1.7,
            }}
          >
            Este submódulo puede alimentar automáticamente el sistema de alertas
            cuando una garantía esté próxima a vencer o ya vencida.
          </div>
        </div>
      </div>
    </div>
  )
}

function GarantiaRow({ garantia }: { garantia: GarantiaProyecto }) {
  const dias = diasParaVencer(garantia.fecha_vencimiento)
  const estado = dias < 0 ? 'Vencida' : dias <= 30 ? 'Por vencer' : 'Vigente'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
        gap: 12,
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        alignItems: 'center',
      }}
    >
      <div style={cellStyle}>{garantia.tipo}</div>
      <div style={cellStyle}>{garantia.numero_documento}</div>
      <div style={cellStyle}>{garantia.emisor || '-'}</div>
      <div style={cellStyle}>CLP {formatCurrency(Number(garantia.monto ?? 0))}</div>
      <div style={cellStyle}>{garantia.fecha_vencimiento ? formatDate(garantia.fecha_vencimiento) : '-'}</div>
      <div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            background: getEstadoBg(estado),
            color: getEstadoColor(estado),
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {estado}
        </span>
      </div>
    </div>
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

function diasParaVencer(fecha?: string | null) {
  if (!fecha) return 9999
  const hoy = new Date()
  const venc = new Date(fecha)
  const diff = venc.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL').format(value)
}

function getEstadoBg(estado: string) {
  if (estado === 'Vigente') return '#dcfce7'
  if (estado === 'Por vencer') return '#fef3c7'
  return '#fee2e2'
}

function getEstadoColor(estado: string) {
  if (estado === 'Vigente') return '#16a34a'
  if (estado === 'Por vencer') return '#ca8a04'
  return '#dc2626'
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

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
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

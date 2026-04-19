'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearTransferencia } from '../../../app/cartera-proyectos/actions/transferencias'
import type { ProyectoFicha, TransferenciaProyecto } from '../../../lib/project-types'


export default function FinanciamientoTab({
  proyecto,
  transferencias,
}: {
  proyecto: ProyectoFicha | null
  transferencias: TransferenciaProyecto[]
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
          No se pudo cargar la información de financiamiento del proyecto.
        </div>
      )
    }
  
    const montoTotal = getProjectBudget(proyecto)
    const avanceFinanciero = Number(proyecto.avance_financiero_actual ?? 0)
    const montoEjecutado = Math.round((montoTotal * avanceFinanciero) / 100)
    const saldoPendiente = Math.max(montoTotal - montoEjecutado, 0)
  
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={titleStyle}>Resumen de Financiamiento</h3>
  
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              <Info label="Fuente principal" value={proyecto.fuente?.nombre ?? '-'} />
              <Info
                label="Monto total aprobado"
                value={`CLP ${formatCurrency(montoTotal)}`}
              />
              <Info
                label="Avance financiero"
                value={`${avanceFinanciero}%`}
              />
              <Info
                label="Saldo pendiente"
                value={`CLP ${formatCurrency(saldoPendiente)}`}
              />
            </div>
  
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                <span>Ejecución financiera</span>
                <span>{avanceFinanciero}%</span>
              </div>
  
              <div
                style={{
                  width: '100%',
                  height: 10,
                  borderRadius: 999,
                  background: '#e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${avanceFinanciero}%`,
                    height: '100%',
                    background: '#2563eb',
                  }}
                />
              </div>
            </div>
          </div>
  
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <h3 style={titleStyle}>Transferencias</h3>
  
              <button
  onClick={() => setShowForm(true)}
  style={{
    height: 40,
    padding: '0 14px',
    borderRadius: 12,
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  }}
>
  Nueva transferencia
</button>

{showForm && (
  <form
    action={async (formData) => {
      formData.append('proyecto_id', proyecto.id)

      const res = await crearTransferencia(formData)

      if (!res.success) {
        alert(res.error)
        return
      }

      setShowForm(false)
      router.refresh()
    }}
    style={{
      marginBottom: 20,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr auto',
      gap: 10,
    }}
  >
    <input
      name="concepto"
      placeholder="Concepto"
      required
      style={inputStyle}
    />

    <input
      type="date"
      name="fecha"
      style={inputStyle}
    />

    <input
      name="monto"
      type="number"
      placeholder="Monto"
      required
      style={inputStyle}
    />

    <button type="submit" style={submitStyle}>
      Guardar
    </button>
  </form>
)}



            </div>
  
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
                  gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
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
                <div>Concepto</div>
                <div>Fecha</div>
                <div>Monto</div>
                <div>Estado</div>
              </div>
  
              {transferencias.length === 0 ? (
  <div
    style={{
      padding: 20,
      borderTop: '1px solid #e5e7eb',
      fontSize: 14,
      color: '#6b7280',
    }}
  >
    Aún no hay transferencias registradas.
  </div>
) : (
  transferencias.map((t) => (
    <TransferRow
      key={t.id}
      concepto={t.concepto ?? '-'}
      fecha={t.fecha ? formatDate(t.fecha) : 'Pendiente'}
      monto={`CLP ${formatCurrency(Number(t.monto ?? 0))}`}
      estado={normalizarEstado(t.estado)}
      bg={getEstadoBg(t.estado)}
      color={getEstadoColor(t.estado)}
    />
  ))
)}
            </div>
          </div>
        </div>
  
        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={titleStyle}>Indicadores Financieros</h3>
  
            <MetricCard
              label="Monto ejecutado"
              value={`CLP ${formatCurrency(montoEjecutado)}`}
              subtitle="Según avance financiero actual"
              color="#16a34a"
              bg="#ecfdf5"
            />
  
            <MetricCard
              label="Saldo disponible"
              value={`CLP ${formatCurrency(saldoPendiente)}`}
              subtitle="Pendiente de ejecución"
              color="#ea580c"
              bg="#fff7ed"
            />
  
            <MetricCard
              label="Fuente principal"
              value={proyecto.fuente?.nombre ?? '-'}
              subtitle="Origen del financiamiento"
              color="#2563eb"
              bg="#eff6ff"
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
              Este módulo está preparado para integrar transferencias reales,
              modificaciones presupuestarias y conciliación con la etapa de rendición.
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  function Info({
    label,
    value,
  }: {
    label: string
    value?: string
  }) {
    return (
      <div>
        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {value ?? '-'}
        </div>
      </div>
    )
  }
  
  function TransferRow({
    concepto,
    fecha,
    monto,
    estado,
    bg,
    color,
  }: {
    concepto: string
    fecha: string
    monto: string
    estado: string
    bg: string
    color: string
  }) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: 12,
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          alignItems: 'center',
        }}
      >
        <div style={cellStyle}>{concepto}</div>
        <div style={cellStyle}>{fecha}</div>
        <div style={cellStyle}>{monto}</div>
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 28,
              padding: '0 12px',
              borderRadius: 999,
              background: bg,
              color,
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
  
  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CL').format(value)
  }

  function getProjectBudget(proyecto: ProyectoFicha) {
    return Number(proyecto.presupuesto_total ?? proyecto.monto_estimado ?? 0)
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL')
  }
  
  function normalizarEstado(estado?: string | null) {
    if (estado === 'registrada') return 'Registrada'
    if (estado === 'pendiente') return 'Pendiente'
    if (estado === 'rechazada') return 'Rechazada'
    return 'Registrada'
  }
  
  function getEstadoBg(estado?: string | null) {
    if (estado === 'registrada') return '#dcfce7'
    if (estado === 'pendiente') return '#fef3c7'
    if (estado === 'rechazada') return '#fee2e2'
    return '#dcfce7'
  }
  
  function getEstadoColor(estado?: string | null) {
    if (estado === 'registrada') return '#16a34a'
    if (estado === 'pendiente') return '#ca8a04'
    if (estado === 'rechazada') return '#dc2626'
    return '#16a34a'
  }

  const inputStyle: React.CSSProperties = {
    height: 40,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    padding: '0 10px',
    fontSize: 14,
    background: '#ffffff',
    color: '#111827',
    boxSizing: 'border-box',
  }
  
  const submitStyle: React.CSSProperties = {
    height: 40,
    borderRadius: 10,
    border: 'none',
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 14px',
  }

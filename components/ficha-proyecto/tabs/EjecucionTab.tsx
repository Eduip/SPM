'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarEstadoPagoEstado,
  crearEstadoPago,
  subirDocumentoEstadoPago,
} from '../../../app/cartera-proyectos/actions/estados-pago'
import type { EstadoPagoProyecto, ProyectoFicha } from '../../../lib/project-types'

export default function EjecucionTab({
  proyecto,
  estadosPago,
}: {
  proyecto: ProyectoFicha | null
  estadosPago: EstadoPagoProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [uploadingForId, setUploadingForId] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  if (!proyecto) {
    return (
      <div style={errorCardStyle}>
        No se pudo cargar la información de ejecución del proyecto.
      </div>
    )
  }

  const totalPagado = estadosPago
    .filter((ep) => normalizeEstadoPago(ep.estado) === 'pagado')
    .reduce(
    (acc, ep) => acc + Number(ep.monto ?? 0),
    0
  )

  const montoProyecto = getProjectBudget(proyecto)

  const porcentaje =
    montoProyecto > 0 ? Math.round((totalPagado / montoProyecto) * 100) : 0

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
            + Añadir Estado de Pago
          </button>
        </div>

        {message && (
          <div
            style={{
              borderRadius: 14,
              border: message.includes('correctamente')
                ? '1px solid #bbf7d0'
                : '1px solid #fecaca',
              background: message.includes('correctamente') ? '#ecfdf5' : '#fef2f2',
              color: message.includes('correctamente') ? '#166534' : '#b91c1c',
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        {showForm && (
          <form
            action={async (formData) => {
              formData.append('proyecto_id', proyecto.id)

              const res = await crearEstadoPago(formData)
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
              name="numero"
              type="number"
              placeholder="N° Estado de Pago"
              required
              style={inputStyle}
            />

            <input
              type="date"
              name="fecha"
              required
              style={inputStyle}
            />

            <input
              name="monto"
              type="number"
              placeholder="Monto"
              required
              style={inputStyle}
            />

            <input
              name="avance_fisico"
              type="number"
              placeholder="% avance físico"
              style={inputStyle}
            />

            <button type="submit" style={submitStyle}>
              Guardar
            </button>
          </form>
        )}

        <div style={cardStyle}>
          <div style={tableHeaderStyle}>
            <div>Estado de Pago</div>
            <div>Estado</div>
            <div>Monto</div>
            <div>Avance Físico</div>
            <div>Documentos</div>
            <div>Acciones</div>
          </div>

          {estadosPago.length === 0 ? (
            <div
              style={{
                padding: 20,
                borderTop: '1px solid #e5e7eb',
                fontSize: 14,
                color: '#6b7280',
              }}
            >
              Aún no hay estados de pago registrados.
            </div>
          ) : (
            estadosPago.map((ep) => {
              const documentos = ep.documentos ?? []

              return (
                <div key={ep.id}>
                  <div style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>
                        Estado de Pago N°{ep.numero}
                      </div>
                      <div style={subStyle}>
                        {ep.fecha ? formatDate(ep.fecha) : '-'}
                      </div>
                    </div>

                    <EstadoSelect
                      estado={ep.estado}
                      onChange={async (estado) => {
                        setMessage('')
                        const formData = new FormData()
                        formData.append('proyecto_id', proyecto.id)
                        formData.append('estado_pago_id', ep.id)
                        formData.append('estado', estado)

                        const result = await actualizarEstadoPagoEstado(formData)

                        if (!result.success) {
                          setMessage(result.error || 'No se pudo actualizar el estado.')
                          return
                        }

                        router.refresh()
                      }}
                    />

                    <div style={cellStyle}>
                      CLP {formatCurrency(Number(ep.monto ?? 0))}
                    </div>

                    <div style={cellStyle}>
                      {Number(ep.avance_fisico ?? 0)}%
                    </div>

                    <div style={cellStyle}>
                      {documentos.length === 0 ? (
                        'Sin documentos'
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {documentos.slice(0, 2).map((documento) => (
                            <span key={documento.id}>
                              {documento.nombre_archivo || documento.nombre || 'Documento'}
                            </span>
                          ))}
                          {documentos.length > 2 && (
                            <span>+{documentos.length - 2} documento(s)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadingForId(uploadingForId === ep.id ? '' : ep.id)
                        }
                        style={secondaryButtonStyle}
                      >
                        Subir documento
                      </button>
                    </div>
                  </div>

                  {uploadingForId === ep.id && (
                    <form
                      action={async (formData) => {
                        setMessage('')
                        formData.append('proyecto_id', proyecto.id)
                        formData.append('estado_pago_id', ep.id)

                        const result = await subirDocumentoEstadoPago(formData)

                        if (!result.success) {
                          setMessage(result.error || 'No se pudo subir el documento.')
                          return
                        }

                        setMessage('Documento subido correctamente.')
                        setUploadingForId('')
                        router.refresh()
                      }}
                      style={uploadFormStyle}
                    >
                      <input name="documento" type="file" required style={fileInputStyle} />
                      <button type="submit" style={submitStyle}>
                        Guardar documento
                      </button>
                    </form>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>Resumen Ejecución</h3>

          <MetricCard
            label="Estados de pago"
            value={String(estadosPago.length)}
            subtitle="Registros cargados"
            color="#2563eb"
            bg="#eff6ff"
          />

          <MetricCard
            label="Monto pagado"
            value={`CLP ${formatCurrency(totalPagado)}`}
            subtitle="Total acumulado"
            color="#16a34a"
            bg="#ecfdf5"
          />

          <MetricCard
            label="Avance financiero"
            value={`${porcentaje}%`}
            subtitle="Según estados de pago"
            color="#ea580c"
            bg="#fff7ed"
          />
        </div>
      </div>
    </div>
  )
}

function EstadoSelect({
  estado,
  onChange,
}: {
  estado?: string | null
  onChange: (estado: string) => void
}) {
  return (
    <select
      value={normalizeEstadoPago(estado)}
      onChange={(event) => onChange(event.target.value)}
      style={selectStateStyle}
    >
      <option value="pendiente_pago">Pendiente de pago</option>
      <option value="pagado">Pagado</option>
    </select>
  )
}

function normalizeEstadoPago(estado?: string | null) {
  return estado === 'pagado' ? 'pagado' : 'pendiente_pago'
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

function getProjectBudget(proyecto: ProyectoFicha) {
  return Number(proyecto.presupuesto_total ?? proyecto.monto_estimado ?? 0)
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

const secondaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
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

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '9px 12px',
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

const subStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.35fr 1.1fr 1fr 0.9fr 1.5fr 1.1fr',
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
  gridTemplateColumns: '1.35fr 1.1fr 1fr 0.9fr 1.5fr 1.1fr',
  gap: 12,
  padding: '16px',
  borderTop: '1px solid #e5e7eb',
  alignItems: 'center',
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
}

const selectStateStyle: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontSize: 13,
  fontWeight: 700,
  padding: '0 10px',
}

const uploadFormStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
  padding: 14,
  borderTop: '1px solid #e5e7eb',
  background: '#f9fafb',
}

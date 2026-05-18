'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Download, Eye, Paperclip, X } from 'lucide-react'
import {
  actualizarEstadoPagoEstado,
  crearEstadoPago,
  guardarInformacionPagoProveedor,
  obtenerUrlDocumentoEstadoPago,
  subirDocumentoEstadoPago,
} from '../../../app/cartera-proyectos/actions/estados-pago'
import type {
  DocumentoRequeridoEstadoPago,
  DocumentoEstadoPago,
  EstadoPagoProyecto,
  ProyectoFicha,
} from '../../../lib/project-types'

export default function EjecucionTab({
  proyecto,
  estadosPago,
  documentosRequeridos,
}: {
  proyecto: ProyectoFicha | null
  estadosPago: EstadoPagoProyecto[]
  documentosRequeridos: DocumentoRequeridoEstadoPago[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [uploadingForId, setUploadingForId] = useState('')
  const [paymentForId, setPaymentForId] = useState('')
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
    .reduce((acc, ep) => acc + Number(ep.monto ?? 0), 0)

  const montoProyecto = getProjectBudget(proyecto)

  const porcentaje =
    montoProyecto > 0 ? Math.round((totalPagado / montoProyecto) * 100) : 0
  const paymentEstadoPago = estadosPago.find((ep) => ep.id === paymentForId)

  const handleDocumentoAction = async (
    documento: DocumentoEstadoPago,
    descargar: boolean
  ) => {
    setMessage('')

    const result = await obtenerUrlDocumentoEstadoPago({
      bucket: documento.bucket,
      rutaStorage: documento.ruta_storage,
      nombreArchivo: documento.nombre_archivo || documento.nombre,
      descargar,
    })

    if (!result.success || !result.url) {
      setMessage(result.error || 'No se pudo abrir el documento.')
      return
    }

    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
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
              formData.append(
                'documentos_requeridos',
                JSON.stringify(
                  documentosRequeridos.map((documento) => ({
                    id: documento.id,
                    nombre: documento.nombre,
                    obligatorio: documento.obligatorio,
                  }))
                )
              )

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

            {documentosRequeridos.length > 0 && (
              <div style={requiredDocsCardStyle}>
                <div style={requiredDocsTitleStyle}>Documentos del estado de pago</div>
                <div style={requiredDocsSubtitleStyle}>
                  Esta fuente exige adjuntar estos documentos al momento de crear el estado de pago.
                </div>
                <div style={requiredDocsGridStyle}>
                  {documentosRequeridos.map((documento) => (
                    <label key={documento.id} style={fieldStyle}>
                      <span style={labelStyle}>
                        {documento.nombre}
                        {documento.obligatorio ? ' *' : ''}
                      </span>
                      <input
                        name={`documento_requerido_${documento.id}`}
                        type="file"
                        required={documento.obligatorio}
                        style={fileInputStyle}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

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
              const pagoProveedor = ep.pago_proveedor

              return (
                <div key={ep.id}>
                  <div style={rowStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
                        Estado de Pago N°{ep.numero}
                      </div>
                      <div style={subStyle}>
                        {ep.fecha ? formatDate(ep.fecha) : '-'}
                      </div>
                      {pagoProveedor?.fecha_transferencia && (
                        <div style={{ ...subStyle, marginTop: 4, color: 'var(--success)' }}>
                          Pago: {formatDate(pagoProveedor.fecha_transferencia)}
                        </div>
                      )}
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
                        <div style={documentListStyle}>
                          {documentos.map((documento, index) => (
                            <DocumentoRow
                              key={documento.id ?? `${documento.ruta_storage}-${index}`}
                              documento={documento}
                              onView={() => handleDocumentoAction(documento, false)}
                              onDownload={() => handleDocumentoAction(documento, true)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadingForId(uploadingForId === ep.id ? '' : ep.id)
                        }
                        style={iconButtonStyle}
                        title="Adjuntar documento"
                        aria-label="Adjuntar documento"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentForId(ep.id)}
                        style={iconButtonStyle}
                        title="Agregar información de pago"
                        aria-label="Agregar información de pago"
                      >
                        <CreditCard size={18} />
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

      {paymentEstadoPago && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <form
            action={async (formData) => {
              setMessage('')
              formData.append('proyecto_id', proyecto.id)
              formData.append('estado_pago_id', paymentEstadoPago.id)

              const result = await guardarInformacionPagoProveedor(formData)

              if (!result.success) {
                setMessage(result.error || 'No se pudo guardar la información de pago.')
                return
              }

              setMessage('Información de pago guardada correctamente.')
              setPaymentForId('')
              router.refresh()
            }}
            style={modalCardStyle}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 id="payment-modal-title" style={modalTitleStyle}>
                  Información de pago
                </h3>
                <p style={modalSubtitleStyle}>
                  Estado de Pago N°{paymentEstadoPago.numero}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentForId('')}
                style={modalCloseButtonStyle}
                aria-label="Cerrar formulario de pago"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={modalGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Fecha de transferencia</span>
                <input
                  name="fecha_transferencia"
                  type="date"
                  required
                  defaultValue={paymentEstadoPago.pago_proveedor?.fecha_transferencia ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Número de cartola</span>
                <input
                  name="numero_cartola"
                  placeholder="Ej: 18452"
                  required
                  defaultValue={paymentEstadoPago.pago_proveedor?.numero_cartola ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Adjuntar cartola</span>
                <input name="cartola" type="file" style={fileInputStyle} />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Número decreto de pago</span>
                <input
                  name="numero_decreto_pago"
                  placeholder="Ej: 1024"
                  required
                  defaultValue={paymentEstadoPago.pago_proveedor?.numero_decreto_pago ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Adjuntar decreto de pago</span>
                <input name="decreto_pago" type="file" style={fileInputStyle} />
              </label>

              {(paymentEstadoPago.pago_proveedor?.cartola?.nombre_archivo ||
                paymentEstadoPago.pago_proveedor?.decreto_pago?.nombre_archivo) && (
                <div style={paymentDocsStyle}>
                  {paymentEstadoPago.pago_proveedor.cartola && (
                    <DocumentoRow
                      documento={{
                        ...paymentEstadoPago.pago_proveedor.cartola,
                        nombre:
                          paymentEstadoPago.pago_proveedor.cartola.nombre ||
                          'Cartola actual',
                      }}
                      onView={() =>
                        handleDocumentoAction(
                          paymentEstadoPago.pago_proveedor?.cartola as DocumentoEstadoPago,
                          false
                        )
                      }
                      onDownload={() =>
                        handleDocumentoAction(
                          paymentEstadoPago.pago_proveedor?.cartola as DocumentoEstadoPago,
                          true
                        )
                      }
                    />
                  )}
                  {paymentEstadoPago.pago_proveedor.decreto_pago && (
                    <DocumentoRow
                      documento={{
                        ...paymentEstadoPago.pago_proveedor.decreto_pago,
                        nombre:
                          paymentEstadoPago.pago_proveedor.decreto_pago.nombre ||
                          'Decreto de pago actual',
                      }}
                      onView={() =>
                        handleDocumentoAction(
                          paymentEstadoPago.pago_proveedor?.decreto_pago as DocumentoEstadoPago,
                          false
                        )
                      }
                      onDownload={() =>
                        handleDocumentoAction(
                          paymentEstadoPago.pago_proveedor?.decreto_pago as DocumentoEstadoPago,
                          true
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => setPaymentForId('')}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
              <button type="submit" style={submitStyle}>
                Guardar pago
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function DocumentoRow({
  documento,
  onView,
  onDownload,
}: {
  documento: DocumentoEstadoPago
  onView: () => void
  onDownload: () => void
}) {
  const nombre = documento.nombre_archivo || documento.nombre || 'Documento'

  return (
    <div style={documentRowStyle}>
      <span style={documentNameStyle} title={nombre}>
        {nombre}
      </span>
      <div style={documentActionsStyle}>
        <button
          type="button"
          onClick={onView}
          style={smallIconButtonStyle}
          title="Visualizar documento"
          aria-label={`Visualizar ${nombre}`}
        >
          <Eye size={15} />
        </button>
        <button
          type="button"
          onClick={onDownload}
          style={smallIconButtonStyle}
          title="Descargar documento"
          aria-label={`Descargar ${nombre}`}
        >
          <Download size={15} />
        </button>
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
  color: 'var(--text-strong)',
}

const primaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--primary)',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const iconButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const fileInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '9px 12px',
}

const requiredDocsCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: '1px solid #dbeafe',
  background: '#f8fbff',
}

const requiredDocsTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const requiredDocsSubtitleStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: '#6b7280',
}

const requiredDocsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const submitStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: 'none',
  background: 'var(--success)',
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

const documentListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const documentRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 8,
  alignItems: 'center',
}

const documentNameStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const documentActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
}

const smallIconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
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

const paymentDocsStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  display: 'grid',
  gap: 10,
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 600,
  padding: 12,
  borderRadius: 12,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(17, 24, 39, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
}

const modalCardStyle: React.CSSProperties = {
  width: 'min(720px, 100%)',
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  borderRadius: 18,
  background: '#ffffff',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
  border: '1px solid #e5e7eb',
}

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  padding: '22px 24px 16px',
  borderBottom: '1px solid #e5e7eb',
}

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const modalSubtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 14,
  color: '#6b7280',
  fontWeight: 700,
}

const modalCloseButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const modalGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  padding: 24,
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#374151',
}

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  padding: '16px 24px 24px',
}

const cancelButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 14px',
}

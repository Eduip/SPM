'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, FilePlus2, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  actualizarRendicion,
  actualizarEstadoRendicion,
  adjuntarDocumentosRendicion,
  crearRendicion,
  eliminarRendicion,
  obtenerUrlDocumentoRendicion,
} from '../../../app/cartera-proyectos/actions/rendiciones'
import type {
  DocumentoEstadoPago,
  EstadoPagoProyecto,
  ProyectoFicha,
  RendicionProyecto,
} from '../../../lib/project-types'

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
  const [editingRendicion, setEditingRendicion] = useState<RendicionProyecto | null>(null)
  const [detailsRendicion, setDetailsRendicion] = useState<RendicionProyecto | null>(null)
  const [documentsForRendicion, setDocumentsForRendicion] =
    useState<RendicionProyecto | null>(null)
  const [documentRows, setDocumentRows] = useState([0])
  const [message, setMessage] = useState('')
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

  const handleDocumentoAction = async (
    documento: DocumentoEstadoPago,
    descargar: boolean
  ) => {
    setMessage('')

    const result = await obtenerUrlDocumentoRendicion({
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
      <div style={layoutStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setEditingRendicion(null)
                setShowForm(true)
              }}
              style={primaryButtonStyle}
            >
              <Plus size={18} />
              Nueva rendición
            </button>
          </div>

          {message && (
            <div
              style={{
                ...messageStyle,
                borderColor: message.includes('correctamente') ? '#bbf7d0' : '#fecaca',
                background: message.includes('correctamente') ? '#ecfdf5' : '#fef2f2',
                color: message.includes('correctamente') ? '#166534' : '#b91c1c',
              }}
            >
              {message}
            </div>
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
            <div>Estado</div>
            <div>Documentos</div>
            <div>Acciones</div>
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
              return (
                <div key={r.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
                      Rendición N°{r.numero_rendicion}
                    </div>
                    <div style={subStyle}>{r.observacion || 'Sin observación'}</div>
                  </div>

                  <select
                    value={normalizeEstadoRendicion(r.estado)}
                    onChange={async (event) => {
                      setMessage('')
                      const formData = new FormData()
                      formData.append('proyecto_id', proyecto.id)
                      formData.append('rendicion_id', r.id)
                      formData.append('estado', event.target.value)

                      const result = await actualizarEstadoRendicion(formData)

                      if (!result.success) {
                        setMessage(result.error || 'No se pudo actualizar el estado.')
                        return
                      }

                      router.refresh()
                    }}
                    style={selectStateStyle}
                  >
                    <option value="en_revision">En revisión</option>
                    <option value="observada">Observada</option>
                    <option value="rendido">Rendido</option>
                  </select>

                  <div style={cellStyle}>
                    {(r.documentos ?? []).length === 0 ? (
                      'Sin documentos'
                    ) : (
                      <div style={documentListStyle}>
                        {(r.documentos ?? []).map((documento, index) => (
                          <DocumentoRow
                            key={documento.id ?? `${documento.ruta_storage}-${index}`}
                            documento={documento}
                            onView={() => void handleDocumentoAction(documento, false)}
                            onDownload={() => void handleDocumentoAction(documento, true)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={rowActionsStyle}>
                    <button
                      type="button"
                      onClick={() => setDetailsRendicion(r)}
                      style={detailsButtonStyle}
                    >
                      Ver detalles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentsForRendicion(r)
                        setDocumentRows([0])
                      }}
                      style={smallIconButtonStyle}
                      title="Adjuntar documentación"
                      aria-label="Adjuntar documentación"
                    >
                      <FilePlus2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRendicion(r)
                        setShowForm(true)
                      }}
                      style={smallIconButtonStyle}
                      title="Editar rendición"
                      aria-label="Editar rendición"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          '¿Eliminar esta rendición? Esta acción también eliminará sus documentos asociados.'
                        )
                        if (!confirmed) return

                        setMessage('')
                        const formData = new FormData()
                        formData.append('proyecto_id', proyecto.id)
                        formData.append('rendicion_id', r.id)

                        const result = await eliminarRendicion(formData)

                        if (!result.success) {
                          setMessage(result.error || 'No se pudo eliminar la rendición.')
                          return
                        }

                        setMessage('Rendición eliminada correctamente.')
                        router.refresh()
                      }}
                      style={dangerIconButtonStyle}
                      title="Eliminar rendición"
                      aria-label="Eliminar rendición"
                    >
                      <Trash2 size={15} />
                    </button>
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

      {showForm && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rendicion-modal-title"
        >
          <form
            action={async (formData) => {
              setMessage('')
              formData.append('proyecto_id', proyecto.id)

              if (editingRendicion) {
                formData.append('rendicion_id', editingRendicion.id)
              }

              const res = editingRendicion
                ? await actualizarRendicion(formData)
                : await crearRendicion(formData)

              if (!res.success) {
                setMessage(res.error || 'No se pudo guardar la rendición.')
                return
              }

              setMessage(
                editingRendicion
                  ? 'Rendición actualizada correctamente.'
                  : 'Rendición registrada correctamente.'
              )
              setEditingRendicion(null)
              setShowForm(false)
              router.refresh()
            }}
            style={modalCardStyle}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 id="rendicion-modal-title" style={modalTitleStyle}>
                  {editingRendicion ? 'Editar rendición' : 'Nueva rendición'}
                </h3>
                <p style={modalSubtitleStyle}>
                  {editingRendicion
                    ? 'Actualiza la rendición asociada al proyecto.'
                    : 'Registra una rendición asociada al proyecto o a un estado de pago.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRendicion(null)
                  setShowForm(false)
                }}
                style={modalCloseButtonStyle}
                aria-label="Cerrar formulario de rendición"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={modalGridStyle}>
              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>N° rendición</span>
                <input
                  name="numero_rendicion"
                  type="number"
                  min="1"
                  placeholder="Ej: 1"
                  required
                  defaultValue={editingRendicion?.numero_rendicion ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Estado de pago asociado</span>
                <select
                  name="estado_pago_id"
                  defaultValue={editingRendicion?.estado_pago_id ?? ''}
                  style={inputStyle}
                >
                  <option value="">Sin estado de pago asociado</option>
                  {estadosPago.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      Estado de Pago N°{ep.numero}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Fecha</span>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={editingRendicion?.fecha ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={fieldLabelStyle}>Monto rendido</span>
                <input
                  name="monto_rendido"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 2500000"
                  required
                  defaultValue={editingRendicion?.monto_rendido ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                <span style={fieldLabelStyle}>Observación</span>
                <input
                  name="observacion"
                  placeholder="Observación"
                  defaultValue={editingRendicion?.observacion ?? ''}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => {
                  setEditingRendicion(null)
                  setShowForm(false)
                }}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
              <button type="submit" style={submitStyle}>
                {editingRendicion ? 'Actualizar rendición' : 'Guardar rendición'}
              </button>
            </div>
          </form>
        </div>
      )}

      {documentsForRendicion && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="documentos-rendicion-modal-title"
        >
          <form
            action={async (formData) => {
              setMessage('')
              formData.append('proyecto_id', proyecto.id)
              formData.append('rendicion_id', documentsForRendicion.id)

              const result = await adjuntarDocumentosRendicion(formData)

              if (!result.success) {
                setMessage(result.error || 'No se pudieron adjuntar los documentos.')
                return
              }

              setMessage('Documentos adjuntados correctamente.')
              setDocumentsForRendicion(null)
              setDocumentRows([0])
              router.refresh()
            }}
            style={modalCardStyle}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 id="documentos-rendicion-modal-title" style={modalTitleStyle}>
                  Adjuntar documentación
                </h3>
                <p style={modalSubtitleStyle}>
                  Rendición N°{documentsForRendicion.numero_rendicion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocumentsForRendicion(null)
                  setDocumentRows([0])
                }}
                style={modalCloseButtonStyle}
                aria-label="Cerrar formulario de documentos"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={documentsModalBodyStyle}>
              {documentRows.map((rowId, index) => (
                <div key={rowId} style={documentFormRowStyle}>
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>Nombre de documento</span>
                    <input
                      name="documento_nombre"
                      placeholder="Ej: Factura, boleta, certificado"
                      required
                      style={inputStyle}
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span style={fieldLabelStyle}>Archivo</span>
                    <input
                      name="documento_archivo"
                      type="file"
                      required
                      style={fileInputStyle}
                    />
                  </label>
                  {documentRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDocumentRows((rows) => rows.filter((id) => id !== rowId))
                      }
                      style={removeDocumentButtonStyle}
                      aria-label={`Quitar documento ${index + 1}`}
                      title="Quitar documento"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setDocumentRows((rows) => [...rows, Date.now()])}
                style={secondaryButtonStyle}
              >
                <Plus size={16} />
                Agregar otro documento
              </button>
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => {
                  setDocumentsForRendicion(null)
                  setDocumentRows([0])
                }}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
              <button type="submit" style={submitStyle}>
                Guardar documentos
              </button>
            </div>
          </form>
        </div>
      )}

      {detailsRendicion && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-rendicion-modal-title"
        >
          <div style={detailsModalCardStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 id="detalle-rendicion-modal-title" style={modalTitleStyle}>
                  Detalle de rendición
                </h3>
                <p style={modalSubtitleStyle}>
                  Rendición N°{detailsRendicion.numero_rendicion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsRendicion(null)}
                style={modalCloseButtonStyle}
                aria-label="Cerrar detalle de rendición"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={detailsGridStyle}>
              <DetailItem
                label="Fecha"
                value={detailsRendicion.fecha ? formatDate(detailsRendicion.fecha) : '-'}
              />
              <DetailItem
                label="Monto"
                value={`CLP ${formatCurrency(Number(detailsRendicion.monto_rendido ?? 0))}`}
              />
              <DetailItem
                label="Asociación"
                value={getEstadoPagoLabel(detailsRendicion.estado_pago_id, estadosPago)}
              />
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => setDetailsRendicion(null)}
                style={cancelButtonStyle}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
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
  const nombre = documento.nombre || documento.nombre_archivo || 'Documento'

  return (
    <div style={documentRowStyle}>
      <span style={documentNameStyle} title={nombre}>
        {nombre}
      </span>
      <div style={documentActionsStyle}>
        <button
          type="button"
          onClick={onView}
          style={documentIconButtonStyle}
          title="Visualizar documento"
          aria-label={`Visualizar ${nombre}`}
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={onDownload}
          style={documentIconButtonStyle}
          title="Descargar documento"
          aria-label={`Descargar ${nombre}`}
        >
          <Download size={14} />
        </button>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL').format(value)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}

function normalizeEstadoRendicion(estado?: string | null) {
  if (estado === 'observada') return 'observada'
  if (estado === 'rendido' || estado === 'aprobada') return 'rendido'
  return 'en_revision'
}

function getEstadoPagoLabel(
  estadoPagoId: string | null | undefined,
  estadosPago: EstadoPagoProyecto[]
) {
  const estadoPago = estadosPago.find((ep) => ep.id === estadoPagoId)

  return estadoPago ? `Estado de Pago N°${estadoPago.numero}` : 'Sin asociación'
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
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2.2fr 1fr',
  gap: 20,
  alignItems: 'start',
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

const messageStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--primary)',
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
  gridTemplateColumns: '1.5fr 1fr 1.8fr 1.45fr',
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
  gridTemplateColumns: '1.5fr 1fr 1.8fr 1.45fr',
  gap: 12,
  padding: '16px',
  borderTop: '1px solid #e5e7eb',
  alignItems: 'center',
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
  minWidth: 0,
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

const documentListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
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

const documentIconButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flexWrap: 'wrap',
}

const detailsButtonStyle: React.CSSProperties = {
  height: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
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

const dangerIconButtonStyle: React.CSSProperties = {
  ...smallIconButtonStyle,
  color: 'var(--danger)',
  borderColor: '#fecaca',
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

const detailsModalCardStyle: React.CSSProperties = {
  ...modalCardStyle,
  width: 'min(560px, 100%)',
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

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 12,
  padding: 24,
}

const detailItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  padding: 14,
  borderRadius: 12,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
}

const detailLabelStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 800,
}

const detailValueStyle: React.CSSProperties = {
  color: 'var(--text-strong)',
  fontSize: 14,
  textAlign: 'right',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#374151',
}

const documentsModalBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 24,
}

const documentFormRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: 12,
  alignItems: 'end',
}

const removeDocumentButtonStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#ffffff',
  color: 'var(--danger)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  alignSelf: 'flex-start',
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

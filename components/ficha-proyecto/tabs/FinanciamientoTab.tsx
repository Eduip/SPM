'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  actualizarTransferencia,
  crearTransferencia,
  eliminarTransferencia,
  obtenerUrlDocumentoTransferencia,
} from '../../../app/cartera-proyectos/actions/transferencias'
import type {
  DocumentoEstadoPago,
  ProyectoFicha,
  TransferenciaProyecto,
} from '../../../lib/project-types'

export default function FinanciamientoTab({
  proyecto,
  transferencias,
}: {
  proyecto: ProyectoFicha | null
  transferencias: TransferenciaProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingTransferencia, setEditingTransferencia] =
    useState<TransferenciaProyecto | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  if (!proyecto) {
    return (
      <div style={errorCardStyle}>
        No se pudo cargar la información de financiamiento del proyecto.
      </div>
    )
  }

  const montoTotal = getProjectBudget(proyecto)
  const avanceFinanciero = Number(proyecto.avance_financiero_actual ?? 0)
  const montoEjecutado = Number(
    proyecto.monto_ejecutado_actual ?? Math.round((montoTotal * avanceFinanciero) / 100)
  )
  const saldoPendiente = Math.max(montoTotal - montoEjecutado, 0)

  const handleDocumentoAction = async (
    documento: DocumentoEstadoPago,
    descargar: boolean
  ) => {
    setMessage('')

    const result = await obtenerUrlDocumentoTransferencia({
      bucket: documento.bucket,
      rutaStorage: documento.ruta_storage,
      nombreArchivo: documento.nombre_archivo || documento.nombre,
      descargar,
    })

    if (!result.success || !result.url) {
      setMessage(result.error || 'No se pudo abrir la cartola.')
      return
    }

    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div style={layoutStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={titleStyle}>Resumen de Financiamiento</h3>

            <div style={summaryGridStyle}>
              <Info label="Fuente principal" value={proyecto.fuente?.nombre ?? '-'} />
              <Info
                label="Monto total aprobado"
                value={`CLP ${formatCurrency(montoTotal)}`}
              />
              <Info label="Avance financiero" value={`${avanceFinanciero}%`} />
              <Info
                label="Saldo pendiente"
                value={`CLP ${formatCurrency(saldoPendiente)}`}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={progressHeaderStyle}>
                <span>Ejecución financiera</span>
                <span>{avanceFinanciero}%</span>
              </div>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    width: `${avanceFinanciero}%`,
                    height: '100%',
                    background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <h3 style={titleStyle}>Transferencias</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTransferencia(null)
                  setShowForm(true)
                }}
                style={primaryButtonStyle}
              >
                <Plus size={18} />
                Nueva transferencia
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

            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <div>Quién transfiere</div>
                <div>Fecha de pago</div>
                <div>Monto</div>
                <div>Estado</div>
                <div>Cartola</div>
                <div>Acciones</div>
              </div>

              {transferencias.length === 0 ? (
                <div style={emptyStyle}>Aún no hay transferencias registradas.</div>
              ) : (
                transferencias.map((transferencia) => (
                  <TransferRow
                    key={transferencia.id}
                    transferencia={transferencia}
                    onViewCartola={() => {
                      if (transferencia.cartola) {
                        void handleDocumentoAction(transferencia.cartola, false)
                      }
                    }}
                    onDownloadCartola={() => {
                      if (transferencia.cartola) {
                        void handleDocumentoAction(transferencia.cartola, true)
                      }
                    }}
                    onEdit={() => {
                      setEditingTransferencia(transferencia)
                      setShowForm(true)
                    }}
                    onDelete={async () => {
                      const confirmed = window.confirm(
                        '¿Eliminar esta transferencia? Esta acción también eliminará su cartola asociada.'
                      )
                      if (!confirmed) return

                      setMessage('')

                      const formData = new FormData()
                      formData.append('proyecto_id', proyecto.id)
                      formData.append('transferencia_id', transferencia.id)

                      const result = await eliminarTransferencia(formData)

                      if (!result.success) {
                        setMessage(result.error || 'No se pudo eliminar la transferencia.')
                        return
                      }

                      setMessage('Transferencia eliminada correctamente.')
                      router.refresh()
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

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

            <div style={bodyTextStyle}>
              Este módulo está preparado para integrar transferencias reales,
              modificaciones presupuestarias y conciliación con la etapa de rendición.
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div
          style={modalOverlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <form
            action={async (formData) => {
              setMessage('')
              formData.append('proyecto_id', proyecto.id)

              if (editingTransferencia) {
                formData.append('transferencia_id', editingTransferencia.id)
              }

              const result = editingTransferencia
                ? await actualizarTransferencia(formData)
                : await crearTransferencia(formData)

              if (!result.success) {
                setMessage(result.error || 'No se pudo guardar la transferencia.')
                return
              }

              setMessage(
                editingTransferencia
                  ? 'Transferencia actualizada correctamente.'
                  : 'Transferencia registrada correctamente.'
              )
              setEditingTransferencia(null)
              setShowForm(false)
              router.refresh()
            }}
            style={modalCardStyle}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 id="transfer-modal-title" style={modalTitleStyle}>
                  {editingTransferencia ? 'Editar transferencia' : 'Nueva transferencia'}
                </h3>
                <p style={modalSubtitleStyle}>
                  {editingTransferencia
                    ? 'Actualiza la transferencia recibida por la municipalidad.'
                    : 'Registra el pago recibido por la municipalidad.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTransferencia(null)
                  setShowForm(false)
                }}
                style={modalCloseButtonStyle}
                aria-label="Cerrar formulario de transferencia"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={modalGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Fecha de pago</span>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={editingTransferencia?.fecha ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Quién transfiere</span>
                <input
                  name="concepto"
                  placeholder="Ej: Gobierno Regional"
                  required
                  defaultValue={editingTransferencia?.concepto ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Monto</span>
                <input
                  name="monto"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 15000000"
                  required
                  defaultValue={editingTransferencia?.monto ?? ''}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Adjuntar cartola</span>
                <input name="cartola" type="file" style={fileInputStyle} />
              </label>

              {editingTransferencia?.cartola && (
                <div style={currentDocumentStyle}>
                  Cartola actual:{' '}
                  {editingTransferencia.cartola.nombre_archivo ||
                    editingTransferencia.cartola.nombre ||
                    'Documento'}
                </div>
              )}
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => {
                  setEditingTransferencia(null)
                  setShowForm(false)
                }}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
              <button type="submit" style={submitStyle}>
                {editingTransferencia ? 'Actualizar transferencia' : 'Guardar transferencia'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
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
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value ?? '-'}</div>
    </div>
  )
}

function TransferRow({
  transferencia,
  onViewCartola,
  onDownloadCartola,
  onEdit,
  onDelete,
}: {
  transferencia: TransferenciaProyecto
  onViewCartola: () => void
  onDownloadCartola: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const cartolaNombre =
    transferencia.cartola?.nombre_archivo || transferencia.cartola?.nombre || ''

  return (
    <div style={tableRowStyle}>
      <div style={cellStyle}>{transferencia.concepto ?? '-'}</div>
      <div style={cellStyle}>
        {transferencia.fecha ? formatDate(transferencia.fecha) : 'Pendiente'}
      </div>
      <div style={cellStyle}>
        CLP {formatCurrency(Number(transferencia.monto ?? 0))}
      </div>
      <div>
        <span
          style={{
            ...statusStyle,
            background: getEstadoBg(transferencia.estado),
            color: getEstadoColor(transferencia.estado),
          }}
        >
          {normalizarEstado(transferencia.estado)}
        </span>
      </div>
      <div style={cellStyle}>
        {transferencia.cartola ? (
          <div style={documentRowStyle}>
            <span style={documentNameStyle} title={cartolaNombre}>
              {cartolaNombre}
            </span>
            <div style={documentActionsStyle}>
              <button
                type="button"
                onClick={onViewCartola}
                style={smallIconButtonStyle}
                title="Visualizar cartola"
                aria-label="Visualizar cartola"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={onDownloadCartola}
                style={smallIconButtonStyle}
                title="Descargar cartola"
                aria-label="Descargar cartola"
              >
                <Download size={15} />
              </button>
            </div>
          </div>
        ) : (
          'Sin cartola'
        )}
      </div>
      <div style={rowActionsStyle}>
        <button
          type="button"
          onClick={onEdit}
          style={smallIconButtonStyle}
          title="Editar transferencia"
          aria-label="Editar transferencia"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={dangerIconButtonStyle}
          title="Eliminar transferencia"
          aria-label="Eliminar transferencia"
        >
          <Trash2 size={15} />
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
    <div style={{ ...metricStyle, background: bg }}>
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

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2.2fr 1fr',
  gap: 20,
  alignItems: 'start',
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
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--text-strong)',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 18,
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 6,
}

const infoValueStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text-strong)',
}

const progressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 8,
}

const progressTrackStyle: React.CSSProperties = {
  width: '100%',
  height: 10,
  borderRadius: 999,
  background: '#e5e7eb',
  overflow: 'hidden',
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
  whiteSpace: 'nowrap',
}

const tableStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 0.95fr 0.95fr 0.85fr 1.25fr 0.8fr',
  gap: 12,
  padding: '14px 16px',
  background: '#f9fafb',
  fontSize: 12,
  fontWeight: 800,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 0.95fr 0.95fr 0.85fr 1.25fr 0.8fr',
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

const statusStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 28,
  padding: '0 12px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
}

const emptyStyle: React.CSSProperties = {
  padding: 20,
  borderTop: '1px solid #e5e7eb',
  fontSize: 14,
  color: '#6b7280',
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

const dangerIconButtonStyle: React.CSSProperties = {
  ...smallIconButtonStyle,
  color: 'var(--danger)',
  borderColor: '#fecaca',
}

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
}

const metricStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  border: '1px solid #e5e7eb',
  marginTop: 12,
}

const bodyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#4b5563',
  lineHeight: 1.7,
  marginTop: 18,
}

const messageStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 16,
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
  width: 'min(680px, 100%)',
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

const currentDocumentStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 700,
  padding: 12,
  borderRadius: 12,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
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

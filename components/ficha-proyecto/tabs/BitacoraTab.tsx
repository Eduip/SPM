'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  actualizarBitacora,
  crearBitacora,
  eliminarBitacora,
  obtenerUrlDocumentoBitacora,
} from '../../../app/cartera-proyectos/actions/bitacora'
import type {
  BitacoraProyecto,
  DocumentoEstadoPago,
  ProyectoFicha,
} from '../../../lib/project-types'

const TIPOS_MANUALES = ['observacion', 'incidencia', 'acuerdo', 'visita']

export default function BitacoraTab({
  proyecto,
  bitacora,
}: {
  proyecto: ProyectoFicha
  bitacora: BitacoraProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<BitacoraProyecto | null>(null)
  const [detailEntry, setDetailEntry] = useState<BitacoraProyecto | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const bitacoraManual = bitacora.filter((item) =>
    TIPOS_MANUALES.includes(item.tipo ?? '')
  )

  const handleDocumentoAction = async (
    documento: DocumentoEstadoPago,
    descargar: boolean
  ) => {
    setMessage('')

    const result = await obtenerUrlDocumentoBitacora({
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            setEditingEntry(null)
            setShowForm(true)
          }}
          style={primaryButton}
        >
          <Plus size={18} />
          Nueva entrada
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

      <div style={card}>
        <h3 style={title}>Bitácora Reciente</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bitacoraManual.length === 0 ? (
            <div style={emptyStyle}>Aún no hay entradas registradas en la bitácora.</div>
          ) : (
            bitacoraManual.map((item) => (
              <BitacoraItem
                key={item.id}
                item={item}
                onViewDocumento={(documento) => void handleDocumentoAction(documento, false)}
                onDownloadDocumento={(documento) => void handleDocumentoAction(documento, true)}
                onView={() => setDetailEntry(item)}
                onEdit={() => {
                  setEditingEntry(item)
                  setShowForm(true)
                }}
                onDelete={async () => {
                  const confirmed = window.confirm(
                    '¿Eliminar esta entrada de bitácora? Esta acción también eliminará sus documentos asociados.'
                  )
                  if (!confirmed) return

                  setMessage('')
                  const formData = new FormData()
                  formData.append('proyecto_id', proyecto.id)
                  formData.append('bitacora_id', item.id)

                  const result = await eliminarBitacora(formData)

                  if (!result.success) {
                    setMessage(result.error || 'No se pudo eliminar la entrada.')
                    return
                  }

                  setMessage('Entrada eliminada correctamente.')
                  router.refresh()
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>

    {showForm && (
      <div
        style={modalOverlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bitacora-modal-title"
      >
        <form
          action={async (formData) => {
            setMessage('')
            formData.append('proyecto_id', proyecto.id)

            if (editingEntry) {
              formData.append('bitacora_id', editingEntry.id)
            }

            const res = editingEntry
              ? await actualizarBitacora(formData)
              : await crearBitacora(formData)
            if (!res.success) {
              setMessage(res.error || 'No se pudo guardar la entrada.')
              return
            }

            setMessage(
              editingEntry
                ? 'Entrada actualizada correctamente.'
                : 'Entrada registrada correctamente.'
            )
            setEditingEntry(null)
            setShowForm(false)
            router.refresh()
          }}
          style={modalCardStyle}
        >
          <div style={modalHeaderStyle}>
            <div>
              <h3 id="bitacora-modal-title" style={modalTitleStyle}>
                {editingEntry ? 'Editar entrada' : 'Nueva entrada'}
              </h3>
              <p style={modalSubtitleStyle}>
                {editingEntry
                  ? 'Actualiza la entrada manual de la bitácora del proyecto.'
                  : 'Registra una observación manual para la bitácora del proyecto.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null)
                setShowForm(false)
              }}
              style={modalCloseButtonStyle}
              aria-label="Cerrar formulario de bitácora"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div style={modalGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Tipo</span>
              <select
                name="tipo"
                required
                defaultValue={editingEntry?.tipo ?? ''}
                style={input}
              >
                <option value="">Selecciona tipo</option>
                <option value="observacion">Observación</option>
                <option value="incidencia">Incidencia</option>
                <option value="acuerdo">Acuerdo</option>
                <option value="visita">Visita</option>
              </select>
            </label>

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Descripción</span>
              <textarea
                name="descripcion"
                placeholder="Descripción"
                required
                defaultValue={editingEntry?.descripcion ?? ''}
                style={textareaStyle}
              />
            </label>

            {!editingEntry && (
              <>
                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Nombre de documento</span>
                  <input
                    name="documento_nombre"
                    placeholder="Ej: Acta, fotografía, respaldo"
                    style={input}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={fieldLabelStyle}>Adjuntar documento</span>
                  <input name="documento_archivo" type="file" style={fileInputStyle} />
                </label>
              </>
            )}
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null)
                setShowForm(false)
              }}
              style={cancelButtonStyle}
            >
              Cancelar
            </button>
            <button type="submit" style={submit}>
              {editingEntry ? 'Actualizar entrada' : 'Guardar entrada'}
            </button>
          </div>
        </form>
      </div>
    )}

    {detailEntry && (
      <div
        style={modalOverlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bitacora-detail-title"
      >
        <div style={modalCardStyle}>
          <div style={modalHeaderStyle}>
            <div>
              <h3 id="bitacora-detail-title" style={modalTitleStyle}>
                Detalle de entrada
              </h3>
              <p style={modalSubtitleStyle}>
                {humanize(detailEntry.tipo)} • {formatDateTime(detailEntry.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDetailEntry(null)}
              style={modalCloseButtonStyle}
              aria-label="Cerrar detalle de bitácora"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div style={detailBodyStyle}>
            <DetailItem label="Tipo" value={humanize(detailEntry.tipo)} />
            <DetailItem
              label="Usuario"
              value={detailEntry.usuario?.nombre_completo || 'Usuario no identificado'}
            />
            <DetailItem label="Fecha" value={formatDateTime(detailEntry.created_at)} />
            <div style={detailDescriptionStyle}>
              <span style={fieldLabelStyle}>Descripción</span>
              <p style={{ margin: '8px 0 0', color: '#374151', lineHeight: 1.6 }}>
                {detailEntry.descripcion}
              </p>
            </div>
            {(detailEntry.documentos ?? []).length > 0 && (
              <div style={detailDescriptionStyle}>
                <span style={fieldLabelStyle}>Documentos</span>
                <div style={documentListStyle}>
                  {(detailEntry.documentos ?? []).map((documento, index) => (
                    <DocumentoRow
                      key={documento.id ?? `${documento.ruta_storage}-${index}`}
                      documento={documento}
                      onView={() => void handleDocumentoAction(documento, false)}
                      onDownload={() => void handleDocumentoAction(documento, true)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={() => setDetailEntry(null)}
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
      <span style={fieldLabelStyle}>{label}</span>
      <strong style={{ color: '#111827', fontSize: 14 }}>{value}</strong>
    </div>
  )
}

function BitacoraItem({
  item,
  onViewDocumento,
  onDownloadDocumento,
  onView,
  onEdit,
  onDelete,
}: {
  item: BitacoraProyecto
  onViewDocumento: (documento: DocumentoEstadoPago) => void
  onDownloadDocumento: (documento: DocumentoEstadoPago) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const usuario = item.usuario?.nombre_completo || 'Usuario no identificado'

  return (
    <div style={row}>
      <div style={avatar}>
        {getInitials(usuario)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={itemHeaderStyle}>
          <span style={{ fontWeight: 700 }}>{humanize(item.tipo)}</span>
          <span style={userStyle}>{usuario}</span>
        </div>

        <div style={sub}>{item.descripcion}</div>

        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
          {formatDateTime(item.created_at)}
        </div>

        {(item.documentos ?? []).length > 0 && (
          <div style={documentListStyle}>
            {(item.documentos ?? []).map((documento, index) => (
              <DocumentoRow
                key={documento.id ?? `${documento.ruta_storage}-${index}`}
                documento={documento}
                onView={() => onViewDocumento(documento)}
                onDownload={() => onDownloadDocumento(documento)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={itemActionsStyle}>
        <button
          type="button"
          onClick={onView}
          style={smallIconButtonStyle}
          title="Ver entrada"
          aria-label="Ver entrada"
        >
          <Eye size={15} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          style={smallIconButtonStyle}
          title="Editar entrada"
          aria-label="Editar entrada"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={dangerIconButtonStyle}
          title="Eliminar entrada"
          aria-label="Eliminar entrada"
        >
          <Trash2 size={15} />
        </button>
      </div>
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

function formatDateTime(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

function getInitials(name?: string | null) {
  if (!name) return 'S'
  return name.slice(0, 2).toUpperCase()
}

function humanize(text?: string | null) {
  if (!text) return 'Registro'
  return text.replace('_', ' ')
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  border: '1px solid #e5e7eb',
}

const title: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 12,
}

const row: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: 14,
  borderRadius: 14,
  border: '1px solid #e5e7eb',
}

const avatar: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: '#2563eb',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
}

const sub: React.CSSProperties = {
  fontSize: 14,
  color: '#4b5563',
  marginTop: 4,
}

const itemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const userStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 700,
}

const itemActionsStyle: React.CSSProperties = {
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
  color: '#dc2626',
  borderColor: '#fecaca',
}

const primaryButton: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 10,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}

const input: React.CSSProperties = {
  height: 42,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontSize: 14,
  boxSizing: 'border-box',
}

const fileInputStyle: React.CSSProperties = {
  ...input,
  padding: '9px 12px',
}

const submit: React.CSSProperties = {
  height: 42,
  background: '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0 12px',
  fontWeight: 700,
  cursor: 'pointer',
}

const emptyStyle: React.CSSProperties = {
  padding: 20,
  border: '1px dashed #d1d5db',
  borderRadius: 14,
  color: '#6b7280',
  fontSize: 14,
}

const documentListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 12,
}

const documentRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 8,
  alignItems: 'center',
  maxWidth: 420,
  padding: 10,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
}

const documentNameStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 13,
  color: '#374151',
  fontWeight: 700,
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

const messageStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
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
  width: 'min(640px, 100%)',
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
  color: '#111827',
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
  gridTemplateColumns: '1fr',
  gap: 16,
  padding: 24,
}

const detailBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
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

const detailDescriptionStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
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

const textareaStyle: React.CSSProperties = {
  ...input,
  height: 130,
  padding: 12,
  resize: 'vertical',
  lineHeight: 1.5,
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

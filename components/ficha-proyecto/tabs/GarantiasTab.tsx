'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, FilePenLine, FilePlus2, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  actualizarGarantia,
  adjuntarDocumentoGarantia,
  crearGarantia,
  eliminarGarantia,
  obtenerUrlDocumentoGarantia,
  registrarEndosoGarantia,
} from '../../../app/cartera-proyectos/actions/garantias'
import type {
  DocumentoEstadoPago,
  GarantiaProyecto,
  ProyectoFicha,
} from '../../../lib/project-types'

export default function GarantiasTab({
  proyecto,
  garantias,
}: {
  proyecto: ProyectoFicha | null
  garantias: GarantiaProyecto[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingGarantia, setEditingGarantia] = useState<GarantiaProyecto | null>(null)
  const [documentForGarantia, setDocumentForGarantia] = useState<GarantiaProyecto | null>(null)
  const [endorsementForGarantia, setEndorsementForGarantia] = useState<GarantiaProyecto | null>(null)
  const [message, setMessage] = useState('')
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

  const vigentes = garantias.filter(
    (g) => getEstadoGarantia(g.fecha_vencimiento) === 'Vigente'
  ).length
  const porVencer = garantias.filter(
    (g) => getEstadoGarantia(g.fecha_vencimiento) === 'Por vencer'
  ).length
  const vencidas = garantias.filter(
    (g) => getEstadoGarantia(g.fecha_vencimiento) === 'Vencido'
  ).length

  const handleDocumentoAction = async (
    documento: DocumentoEstadoPago,
    descargar: boolean
  ) => {
    setMessage('')

    const result = await obtenerUrlDocumentoGarantia({
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
              type="button"
              onClick={() => {
                setEditingGarantia(null)
                setShowForm(true)
              }}
              style={primaryButtonStyle}
            >
              <Plus size={18} />
              Nueva garantía
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
                gridTemplateColumns: '1fr 0.9fr 0.9fr 0.9fr 0.95fr 0.9fr 1.25fr 1.1fr',
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
              <div>Documentos</div>
              <div>Acciones</div>
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
                <GarantiaRow
                  key={g.id}
                  garantia={g}
                  onViewDocumento={(documento) => void handleDocumentoAction(documento, false)}
                  onDownloadDocumento={(documento) => void handleDocumentoAction(documento, true)}
                  onAttach={() => setDocumentForGarantia(g)}
                  onEndorse={() => setEndorsementForGarantia(g)}
                  onEdit={() => {
                    setEditingGarantia(g)
                    setShowForm(true)
                  }}
                  onDelete={async () => {
                    const confirmed = window.confirm(
                      '¿Eliminar esta garantía? Esta acción también eliminará sus documentos asociados.'
                    )
                    if (!confirmed) return

                    setMessage('')
                    const formData = new FormData()
                    formData.append('proyecto_id', proyecto.id)
                    formData.append('garantia_id', g.id)

                    const result = await eliminarGarantia(formData)

                    if (!result.success) {
                      setMessage(result.error || 'No se pudo eliminar la garantía.')
                      return
                    }

                    setMessage('Garantía eliminada correctamente.')
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
    {showForm && (
      <div
        style={modalOverlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="garantia-modal-title"
      >
        <form
          action={async (formData) => {
            setMessage('')
            formData.append('proyecto_id', proyecto.id)

            if (editingGarantia) {
              formData.append('garantia_id', editingGarantia.id)
            }

            const res = editingGarantia
              ? await actualizarGarantia(formData)
              : await crearGarantia(formData)

            if (!res.success) {
              setMessage(res.error || 'No se pudo guardar la garantía.')
              return
            }

            setMessage(
              editingGarantia
                ? 'Garantía actualizada correctamente.'
                : 'Garantía registrada correctamente.'
            )
            setEditingGarantia(null)
            setShowForm(false)
            router.refresh()
          }}
          style={modalCardStyle}
        >
          <div style={modalHeaderStyle}>
            <div>
              <h3 id="garantia-modal-title" style={modalTitleStyle}>
                {editingGarantia ? 'Editar garantía' : 'Nueva garantía'}
              </h3>
              <p style={modalSubtitleStyle}>
                {editingGarantia
                  ? 'Actualiza los datos de la garantía asociada al proyecto.'
                  : 'Registra los datos de la garantía asociada al proyecto.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingGarantia(null)
                setShowForm(false)
              }}
              style={modalCloseButtonStyle}
              aria-label="Cerrar formulario de garantía"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div style={modalGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Tipo</span>
              <input
                name="tipo"
                placeholder="Ej: Boleta de garantía"
                required
                defaultValue={editingGarantia?.tipo ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Número documento</span>
              <input
                name="numero_documento"
                placeholder="Número documento"
                required
                defaultValue={editingGarantia?.numero_documento ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Emisor</span>
              <input
                name="emisor"
                placeholder="Emisor"
                defaultValue={editingGarantia?.emisor ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Monto</span>
              <input
                name="monto"
                type="number"
                min="0"
                step="1"
                placeholder="Monto"
                required
                defaultValue={editingGarantia?.monto ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Fecha emisión</span>
              <input
                name="fecha_emision"
                type="date"
                defaultValue={editingGarantia?.fecha_emision ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Fecha vencimiento</span>
              <input
                name="fecha_vencimiento"
                type="date"
                required
                defaultValue={editingGarantia?.fecha_vencimiento ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Observación</span>
              <input
                name="observacion"
                placeholder="Observación"
                defaultValue={editingGarantia?.observacion ?? ''}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={() => {
                setEditingGarantia(null)
                setShowForm(false)
              }}
              style={cancelButtonStyle}
            >
              Cancelar
            </button>
            <button type="submit" style={submitStyle}>
              {editingGarantia ? 'Actualizar garantía' : 'Guardar garantía'}
            </button>
          </div>
        </form>
      </div>
    )}
    {documentForGarantia && (
      <div
        style={modalOverlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="documento-garantia-modal-title"
      >
        <form
          action={async (formData) => {
            setMessage('')
            formData.append('proyecto_id', proyecto.id)
            formData.append('garantia_id', documentForGarantia.id)

            const result = await adjuntarDocumentoGarantia(formData)

            if (!result.success) {
              setMessage(result.error || 'No se pudo adjuntar el documento.')
              return
            }

            setMessage('Documento adjuntado correctamente.')
            setDocumentForGarantia(null)
            router.refresh()
          }}
          style={modalCardStyle}
        >
          <div style={modalHeaderStyle}>
            <div>
              <h3 id="documento-garantia-modal-title" style={modalTitleStyle}>
                Adjuntar documento
              </h3>
              <p style={modalSubtitleStyle}>
                Garantía {documentForGarantia.numero_documento || documentForGarantia.tipo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDocumentForGarantia(null)}
              style={modalCloseButtonStyle}
              aria-label="Cerrar formulario de documento"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div style={modalGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Nombre de documento</span>
              <input
                name="documento_nombre"
                placeholder="Ej: Boleta, póliza, certificado"
                required
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Archivo</span>
              <input name="documento_archivo" type="file" required style={fileInputStyle} />
            </label>
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={() => setDocumentForGarantia(null)}
              style={cancelButtonStyle}
            >
              Cancelar
            </button>
            <button type="submit" style={submitStyle}>
              Guardar documento
            </button>
          </div>
        </form>
      </div>
    )}
    {endorsementForGarantia && (
      <div
        style={modalOverlayStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="endoso-garantia-modal-title"
      >
        <form
          action={async (formData) => {
            setMessage('')
            formData.append('proyecto_id', proyecto.id)
            formData.append('garantia_id', endorsementForGarantia.id)

            const result = await registrarEndosoGarantia(formData)

            if (!result.success) {
              setMessage(result.error || 'No se pudo registrar el endoso.')
              return
            }

            setMessage('Endoso registrado correctamente.')
            setEndorsementForGarantia(null)
            router.refresh()
          }}
          style={modalCardStyle}
        >
          <div style={modalHeaderStyle}>
            <div>
              <h3 id="endoso-garantia-modal-title" style={modalTitleStyle}>
                Registrar endoso
              </h3>
              <p style={modalSubtitleStyle}>
                Garantía {endorsementForGarantia.numero_documento || endorsementForGarantia.tipo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEndorsementForGarantia(null)}
              style={modalCloseButtonStyle}
              aria-label="Cerrar formulario de endoso"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div style={modalGridStyle}>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Motivo del endoso</span>
              <input
                name="motivo"
                placeholder="Ej: ampliar vigencia, corregir glosa, subsanar observación"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Nueva fecha de vencimiento</span>
              <input
                name="nueva_fecha_vencimiento"
                type="date"
                defaultValue={endorsementForGarantia.fecha_vencimiento ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Nombre documento endoso</span>
              <input
                name="documento_nombre"
                placeholder="Ej: Endoso de boleta"
                style={inputStyle}
              />
            </label>

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Nueva glosa / observación</span>
              <input
                name="nueva_glosa"
                placeholder="Si el endoso corrige la glosa, indícalo aquí"
                defaultValue={endorsementForGarantia.observacion ?? ''}
                style={inputStyle}
              />
            </label>

            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Documento de respaldo del endoso</span>
              <input name="documento_archivo" type="file" style={fileInputStyle} />
            </label>
          </div>

          <div style={modalFooterStyle}>
            <button
              type="button"
              onClick={() => setEndorsementForGarantia(null)}
              style={cancelButtonStyle}
            >
              Cancelar
            </button>
            <button type="submit" style={submitStyle}>
              Guardar endoso
            </button>
          </div>
        </form>
      </div>
    )}
    </>
  )
}

function GarantiaRow({
  garantia,
  onViewDocumento,
  onDownloadDocumento,
  onAttach,
  onEndorse,
  onEdit,
  onDelete,
}: {
  garantia: GarantiaProyecto
  onViewDocumento: (documento: DocumentoEstadoPago) => void
  onDownloadDocumento: (documento: DocumentoEstadoPago) => void
  onAttach: () => void
  onEndorse: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const estado = getEstadoGarantia(garantia.fecha_vencimiento)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 0.9fr 0.9fr 0.9fr 0.95fr 0.9fr 1.25fr 1.1fr',
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
      <div style={cellStyle}>
        {(garantia.documentos ?? []).length === 0 ? (
          'Sin documentos'
        ) : (
          <div style={documentListStyle}>
            {(garantia.documentos ?? []).map((documento, index) => (
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
      <div style={rowActionsStyle}>
        <button
          type="button"
          onClick={onAttach}
          style={smallIconButtonStyle}
          title="Adjuntar documento"
          aria-label="Adjuntar documento"
        >
          <FilePlus2 size={15} />
        </button>
        <button
          type="button"
          onClick={onEndorse}
          style={smallIconButtonStyle}
          title="Registrar endoso"
          aria-label="Registrar endoso"
        >
          <FilePenLine size={15} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          style={smallIconButtonStyle}
          title="Editar garantía"
          aria-label="Editar garantía"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={dangerIconButtonStyle}
          title="Eliminar garantía"
          aria-label="Eliminar garantía"
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
  hoy.setHours(0, 0, 0, 0)
  const [year, month, day] = fecha.split('-').map(Number)
  const venc = new Date(year, month - 1, day)
  const diff = venc.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getEstadoGarantia(fecha?: string | null) {
  const dias = diasParaVencer(fecha)

  if (dias < 0) return 'Vencido'
  if (dias < 30) return 'Por vencer'
  return 'Vigente'
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

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2.2fr 1fr',
  gap: 20,
  alignItems: 'start',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 18,
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--text-strong)',
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
  minWidth: 0,
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

const messageStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid',
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 16,
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

const fieldLabelStyle: React.CSSProperties = {
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

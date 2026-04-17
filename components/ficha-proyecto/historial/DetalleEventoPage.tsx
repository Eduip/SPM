'use client'

import { useRouter } from 'next/navigation'
import type { HistorialEvento, ProyectoFicha } from '../../../lib/project-types'

type CambioEvento = {
  campo: string
  anterior: string
  nuevo: string
}

type DocumentoEvento = {
  nombre: string
  tipo: string
  tamano: string
  fecha: string
}

export default function DetalleEventoPage({
  proyecto,
  evento,
}: {
  proyecto: ProyectoFicha
  evento: HistorialEvento
}) {
  const router = useRouter()

  const metadata = evento?.metadata ?? {}
  const cambios = extractCambios(metadata)
  const documentos = extractDocumentos(metadata)
  const observaciones = extractObservaciones(metadata)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              color: '#6b7280',
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            Cartera de Proyectos / {proyecto.codigo_interno ?? '-'} / Historial / Detalle
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 40,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Detalle del Evento
          </h1>

          <div
            style={{
              marginTop: 6,
              fontSize: 16,
              color: '#6b7280',
            }}
          >
            Registro completo de la actividad seleccionada
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.back()}
            style={secondaryButtonStyle}
          >
            ← Volver al historial
          </button>

          <button style={secondaryButtonStyle}>Exportar</button>
          <button style={secondaryButtonStyle}>Imprimir</button>
        </div>
      </div>

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
            <h3 style={titleStyle}>Información del Evento</h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              <InfoItem
                label="Tipo de evento"
                value={humanizeAction(evento.accion)}
              />
              <InfoItem
                label="Fecha y hora"
                value={`${formatDate(evento.created_at)} ${formatTime(evento.created_at)}`}
              />
              <InfoItem
                label="Usuario responsable"
                value={evento.usuario_id ?? 'Sistema'}
              />
              <InfoItem
                label="Módulo asociado"
                value={getModulo(evento)}
              />
              <InfoItem
                label="Estado"
                value={getEstado(evento)}
                isBadge
              />
              <InfoItem
                label="ID del evento"
                value={evento.id}
              />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Descripción del Evento</h3>
            <div style={paragraphStyle}>
              {evento.descripcion ?? 'Sin descripción registrada.'}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Cambios Realizados</h3>

            {cambios.length === 0 ? (
              <div style={emptyTextStyle}>
                No hay cambios estructurados asociados a este evento.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={tableHeaderStyle}>
                  <div>Campo</div>
                  <div>Valor anterior</div>
                  <div>Valor nuevo</div>
                </div>

                {cambios.map((cambio, idx) => (
                  <div key={idx} style={tableRowStyle}>
                    <div style={cellStyleStrong}>{cambio.campo}</div>
                    <div style={cellStyle}>{cambio.anterior}</div>
                    <div style={{ ...cellStyle, color: '#16a34a', fontWeight: 700 }}>
                      {cambio.nuevo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Documentos Asociados</h3>

            {documentos.length === 0 ? (
              <div style={emptyTextStyle}>
                No hay documentos asociados a este evento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {documentos.map((doc, idx) => (
                  <div key={idx} style={documentRowStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>
                        {doc.nombre}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        {doc.tipo} • {doc.tamano} • {doc.fecha}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 14 }}>
                      <button style={linkButtonStyle}>Ver</button>
                      <button style={linkButtonStyle}>Descargar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Observaciones</h3>

            <div
              style={{
                borderRadius: 14,
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: 16,
                fontSize: 14,
                color: '#4b5563',
                lineHeight: 1.7,
              }}
            >
              {observaciones || 'No hay observaciones adicionales registradas para este evento.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={titleStyle}>Resumen del Proyecto</h3>

            <SummaryItem label="Nombre del proyecto" value={proyecto.nombre} />
            <SummaryItem label="Código" value={proyecto.codigo_interno} />
            <SummaryItem
              label="Unidad responsable"
              value={proyecto.unidad?.nombre ?? '-'}
            />
            <SummaryItem
              label="Estado actual"
              value={humanizeEstadoProyecto(proyecto.estado)}
              badge
            />
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Historial del Evento</h3>

            <TimelineItem title="Evento creado" subtitle={`${evento.usuario_id ?? 'Sistema'} • ${formatDateTime(evento.created_at)}`} />
            <TimelineItem title="Datos registrados" subtitle={`Sistema • ${formatDateTime(evento.created_at)}`} />
            <TimelineItem title="Disponible para revisión" subtitle={`Sistema • ${formatDateTime(evento.created_at)}`} />
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Alertas Relacionadas</h3>

            <AlertCard
              title="Verificación de coherencia"
              text="El evento quedó asociado correctamente al proyecto."
              bg="#ecfdf5"
              border="#bbf7d0"
              color="#166534"
            />

            <AlertCard
              title="Recordatorio"
              text="Revisar documentos asociados y seguimiento del evento."
              bg="#fff7ed"
              border="#fed7aa"
              color="#c2410c"
            />
          </div>

          <div style={cardStyle}>
            <h3 style={titleStyle}>Acciones</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button style={primaryButtonStyle}>Marcar como revisado</button>
              <button style={secondaryButtonStyle}>Agregar comentario</button>
              <button style={dangerButtonStyle}>Escalar evento</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  isBadge = false,
}: {
  label: string
  value?: string | null
  isBadge?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
        {label}
      </div>

      {isBadge ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 30,
            padding: '0 12px',
            borderRadius: 999,
            background: '#dcfce7',
            color: '#16a34a',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {value ?? '-'}
        </span>
      ) : (
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {value ?? '-'}
        </div>
      )}
    </div>
  )
}

function SummaryItem({
  label,
  value,
  badge = false,
}: {
  label: string
  value?: string | null
  badge?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
        {label}
      </div>

      {badge ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            background: '#dbeafe',
            color: '#2563eb',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {value ?? '-'}
        </span>
      ) : (
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
          {value ?? '-'}
        </div>
      )}
    </div>
  )
}

function TimelineItem({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div
      style={{
        borderLeft: '2px solid #e5e7eb',
        paddingLeft: 14,
        marginLeft: 8,
        position: 'relative',
        paddingBottom: 14,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: '#2563eb',
          position: 'absolute',
          left: -6,
          top: 4,
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  )
}

function AlertCard({
  title,
  text,
  bg,
  border,
  color,
}: {
  title: string
  text: string
  bg: string
  border: string
  color: string
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: bg,
        border: `1px solid ${border}`,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  )
}

function extractCambios(metadata: Record<string, unknown>): CambioEvento[] {
  if (Array.isArray(metadata.cambios)) {
    return metadata.cambios.map((item) => {
      const cambio = isRecord(item) ? item : {}

      return {
        campo: stringifyValue(cambio.campo),
        anterior: stringifyValue(cambio.anterior),
        nuevo: stringifyValue(cambio.nuevo),
      }
    })
  }

  const antes = metadata.antes
  const despues = metadata.despues

  if (isRecord(antes) && isRecord(despues)) {
    return Object.keys(despues).map((key) => ({
      campo: key,
      anterior: stringifyValue(antes[key]),
      nuevo: stringifyValue(despues[key]),
    }))
  }

  return []
}

function extractDocumentos(metadata: Record<string, unknown>): DocumentoEvento[] {
  if (Array.isArray(metadata.documentos)) {
    return metadata.documentos.map((item) => {
      const documento = isRecord(item) ? item : {}

      return {
        nombre: stringifyValue(documento.nombre),
        tipo: stringifyValue(documento.tipo),
        tamano: stringifyValue(documento.tamano),
        fecha: stringifyValue(documento.fecha),
      }
    })
  }

  return []
}

function extractObservaciones(metadata: Record<string, unknown>) {
  if (typeof metadata.observaciones === 'string') return metadata.observaciones
  return ''
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function humanizeAction(action?: string | null) {
  if (!action) return 'Evento'
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getModulo(evento: HistorialEvento) {
  return evento.metadata?.etapa
    ? String(evento.metadata.etapa).replace(/_/g, ' ')
    : 'Sistema'
}

function getEstado(evento: HistorialEvento) {
  if (evento?.accion === 'aprobar') return 'Aprobado'
  if (evento?.accion === 'rechazar') return 'Rechazado'
  return 'Registrado'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function humanizeEstadoProyecto(estado?: string | null) {
  if (!estado) return 'Sin estado'
  return estado.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(dateString: string) {
  return `${formatDate(dateString)} ${formatTime(dateString)}`
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

const paragraphStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#4b5563',
  lineHeight: 1.8,
}

const emptyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b7280',
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
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
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 12,
  padding: '16px',
  borderTop: '1px solid #e5e7eb',
  alignItems: 'center',
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
}

const cellStyleStrong: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#111827',
}

const documentRowStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  padding: '14px 16px',
  background: '#ffffff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
}

const primaryButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 14px',
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 14px',
}

const dangerButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: '1px solid #fca5a5',
  background: '#ffffff',
  color: '#dc2626',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '0 14px',
}

const linkButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: 700,
  cursor: 'pointer',
}

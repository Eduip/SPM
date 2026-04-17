import type { DocumentoProyecto } from '../../../app/creacion-formulacion/documentos/page'
import { cardStyle } from '../shared'

export default function DocumentosSubidosPanel({
  documentos,
}: {
  documentos: DocumentoProyecto[]
}) {
  const visibles = documentos.slice(0, 5)

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 18 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Documentos Subidos
        </h3>
        <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
          {documentos.length} archivos cargados
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visibles.map((doc) => (
          <div
            key={doc.id}
            style={{
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              padding: 16,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 4,
                  }}
                >
                  {doc.nombre}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {doc.profile?.[0]?.nombre_completo ?? 'Usuario'} • {formatDate(doc.fecha_subida)}
                </div>
              </div>

              <EstadoRevisionBadge
                estado={doc.estado_revision ?? 'subido'}
              />
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginBottom: 8,
              }}
            >
              {getValidationText(doc.estado_revision ?? 'subido')}
            </div>

            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 999,
                background: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${doc.porcentaje_validacion ?? 0}%`,
                  height: '100%',
                  background: getValidationColor(doc.estado_revision ?? 'subido'),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EstadoRevisionBadge({ estado }: { estado: string }) {
  const config =
    estado === 'validado'
      ? { bg: '#dcfce7', color: '#16a34a', label: 'Validado' }
      : estado === 'pendiente_revision'
      ? { bg: '#fef3c7', color: '#ca8a04', label: 'En revisión' }
      : estado === 'rechazado'
      ? { bg: '#fee2e2', color: '#dc2626', label: 'Rechazado' }
      : { bg: '#dbeafe', color: '#2563eb', label: 'Subido' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 12px',
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}

function getValidationText(estado: string) {
  if (estado === 'validado') return 'Validación completa'
  if (estado === 'pendiente_revision') return 'Validando...'
  if (estado === 'rechazado') return 'Documento rechazado'
  return 'Documento cargado'
}

function getValidationColor(estado: string) {
  if (estado === 'validado') return '#22c55e'
  if (estado === 'pendiente_revision') return '#eab308'
  if (estado === 'rechazado') return '#ef4444'
  return '#2563eb'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}
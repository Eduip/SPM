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
            color: 'var(--text-strong)',
          }}
        >
          Documentos Subidos
        </h3>
        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>
          {documentos.length} archivos cargados
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visibles.map((doc) => (
          <div
            key={doc.id}
            style={{
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 16,
              background: 'var(--surface)',
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
                    color: 'var(--text-strong)',
                    marginBottom: 4,
                  }}
                >
                  {doc.nombre}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
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
                color: 'var(--text-muted)',
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
                background: 'var(--border)',
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
      ? { bg: '#dcfce7', color: 'var(--success)', label: 'Validado' }
      : estado === 'pendiente_revision'
      ? { bg: '#fef3c7', color: '#ca8a04', label: 'En revisión' }
      : estado === 'rechazado'
      ? { bg: '#fee2e2', color: 'var(--danger)', label: 'Rechazado' }
      : { bg: 'var(--primary-soft)', color: 'var(--primary)', label: 'Subido' }

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
  if (estado === 'validado') return 'var(--success)'
  if (estado === 'pendiente_revision') return '#eab308'
  if (estado === 'rechazado') return '#ef4444'
  return 'var(--primary)'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL')
}
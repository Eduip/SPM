import { cardStyle } from '../shared'
import type {
  CampoPostulacion,
  RespuestaPostulacion,
} from '../../../lib/formulacion-types'

export default function PostulacionDinamicaCard({
  fuenteNombre,
  campos,
  respuestas,
}: {
  fuenteNombre: string
  campos: CampoPostulacion[]
  respuestas: RespuestaPostulacion[]
}) {
  const respuestaMap = new Map(respuestas.map((respuesta) => [respuesta.campo_id, respuesta]))

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Postulación
      </h3>

      <InfoBox label="Fuente de Financiamiento" value={fuenteNombre || '-'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        {campos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', color: '#6b7280', fontSize: 14 }}>
            No hay campos configurados para la fuente seleccionada.
          </div>
        ) : (
          campos.map((campo) => (
            <InfoBox
              key={campo.id}
              label={`${campo.nombre}${campo.obligatorio ? ' *' : ''}`}
              value={formatRespuesta(respuestaMap.get(campo.id))}
              full={campo.tipo === 'texto_largo'}
            />
          ))
        )}
      </div>
    </div>
  )
}

function InfoBox({
  label,
  value,
  full,
}: {
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div
      style={{
        gridColumn: full ? '1 / -1' : 'auto',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'pre-wrap' }}>
        {value || '-'}
      </div>
    </div>
  )
}

function formatRespuesta(respuesta: RespuestaPostulacion | undefined) {
  if (!respuesta) return '-'
  if (respuesta.valor_texto !== null) return respuesta.valor_texto
  if (respuesta.valor_numero !== null) return String(respuesta.valor_numero)
  if (respuesta.valor_booleano !== null) return respuesta.valor_booleano ? 'Sí' : 'No'
  if (respuesta.valor_fecha !== null) return respuesta.valor_fecha
  if (respuesta.valor_json !== null) return JSON.stringify(respuesta.valor_json)
  return '-'
}

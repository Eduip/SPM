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
  const respuestaMap = new Map<string, RespuestaPostulacion>(
    respuestas.map((respuesta) => [respuesta.campo_id, respuesta] as const)
  )
  const descripcion = campos.filter((campo) => getFieldSection(campo.tipo) === 'descripcion')
  const plazos = campos.filter((campo) => getFieldSection(campo.tipo) === 'plazo')
  const presupuestos = campos.filter((campo) => getFieldSection(campo.tipo) === 'presupuesto')
  const plazoTotal = sumRespuestas(plazos, respuestaMap)
  const presupuestoTotal = sumRespuestas(presupuestos, respuestaMap)

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Postulación
      </h3>

      <InfoBox label="Fuente de Financiamiento" value={fuenteNombre || '-'} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        <ResponseSection
          title="Descripción"
          campos={descripcion}
          respuestaMap={respuestaMap}
          emptyText="No hay campos de descripción configurados."
        />
        <ResponseSection
          title="Plazos"
          campos={plazos}
          respuestaMap={respuestaMap}
          emptyText="No hay plazos configurados."
          totalLabel="Plazo total"
          totalValue={`${plazoTotal} días`}
        />
        <ResponseSection
          title="Presupuesto"
          campos={presupuestos}
          respuestaMap={respuestaMap}
          emptyText="No hay presupuesto configurado."
          totalLabel="Presupuesto total"
          totalValue={`CLP ${new Intl.NumberFormat('es-CL').format(presupuestoTotal)}`}
        />
      </div>
    </div>
  )
}

function ResponseSection({
  title,
  campos,
  respuestaMap,
  emptyText,
  totalLabel,
  totalValue,
}: {
  title: string
  campos: CampoPostulacion[]
  respuestaMap: Map<string, RespuestaPostulacion>
  emptyText: string
  totalLabel?: string
  totalValue?: string
}) {
  return (
    <section style={sectionStyle}>
      <h4 style={sectionTitleStyle}>{title}</h4>
      {campos.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {campos.map((campo) => (
            <InfoBox
              key={campo.id}
              label={`${campo.nombre}${campo.obligatorio ? ' *' : ''}`}
              value={formatRespuesta(respuestaMap.get(campo.id))}
              full={campo.tipo === 'texto_largo'}
            />
          ))}
        </div>
      )}

      {totalLabel ? (
        <div style={totalStyle}>
          <span>{totalLabel}</span>
          <strong>{totalValue}</strong>
        </div>
      ) : null}
    </section>
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
        border: '1px solid var(--border)',
        background: '#f9fafb',
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', whiteSpace: 'pre-wrap' }}>
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

function getFieldSection(tipo: string) {
  if (tipo === 'plazo') return 'plazo'
  if (tipo === 'presupuesto' || tipo === 'tabla_presupuesto') return 'presupuesto'
  return 'descripcion'
}

function sumRespuestas(
  campos: CampoPostulacion[],
  respuestaMap: Map<string, RespuestaPostulacion>
) {
  return campos.reduce<number>((total, campo) => {
    const respuesta = respuestaMap.get(campo.id) as RespuestaPostulacion | undefined
    return total + responseValueToNumber(respuesta)
  }, 0)
}

function responseValueToNumber(respuesta: RespuestaPostulacion | undefined): number {
  if (!respuesta) return 0

  if (respuesta.valor_numero !== null && respuesta.valor_numero !== undefined) {
    return Number(respuesta.valor_numero) || 0
  }

  if (typeof respuesta.valor_json === 'number') {
    return respuesta.valor_json
  }

  if (typeof respuesta.valor_json === 'string') {
    const parsed = Number(String(respuesta.valor_json).replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (respuesta.valor_json && typeof respuesta.valor_json === 'object' && !Array.isArray(respuesta.valor_json)) {
    return Object.values(respuesta.valor_json as Record<string, unknown>).reduce<number>((acc, value) => {
      if (typeof value === 'number') return acc + value
      if (typeof value === 'string') {
        const parsed = Number(String(value).replace(/\./g, '').replace(',', '.'))
        return acc + (Number.isFinite(parsed) ? parsed : 0)
      }
      return acc
    }, 0)
  }

  return 0
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: '#f9fafb',
  padding: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 17,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const totalStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 14,
  border: '1px solid var(--primary-soft)',
  background: 'var(--primary-tint)',
  color: 'var(--primary-dark)',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 15,
  fontWeight: 800,
}

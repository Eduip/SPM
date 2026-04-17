import { cardStyle } from '../shared'

export default function EstadoDocumentacionPanel({
  total,
  subidos,
  pendientes,
  faltantes,
}: {
  total: number
  subidos: number
  pendientes: number
  faltantes: number
}) {
  const subidosPct = total ? Math.round((subidos / total) * 100) : 0
  const pendientesPct = total ? Math.round((pendientes / total) * 100) : 0
  const faltantesPct = total ? Math.round((faltantes / total) * 100) : 0

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 18, fontWeight: 700 }}>
        Estado de Documentación
      </h3>

      <StateRow label="Subidos" value={`${subidosPct}%`} count={`${subidos} de ${total}`} color="#22c55e" />
      <StateRow label="Pendientes" value={`${pendientesPct}%`} count={`${pendientes} de ${total}`} color="#eab308" />
      <StateRow label="Faltantes" value={`${faltantesPct}%`} count={`${faltantes} de ${total}`} color="#ef4444" />

      {faltantes > 0 && (
        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: 16,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <strong>Documentos obligatorios faltantes</strong>
          <br />
          Completa la carga de documentos obligatorios antes de continuar a la etapa de aprobación.
        </div>
      )}
    </div>
  )
}

function StateRow({
  label,
  value,
  count,
  color,
}: {
  label: string
  value: string
  count: string
  color: string
}) {
  const pct = Number(value.replace('%', '')) || 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 700,
          color: '#374151',
        }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{count}</div>

      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 999,
          background: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}
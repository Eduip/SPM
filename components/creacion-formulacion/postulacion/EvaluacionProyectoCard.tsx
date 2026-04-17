import { cardStyle } from '../shared'

type Props = {
  puntajeTotal: number
  porcentaje: number
  aprobado: boolean
  puntajeDiagnostico: number
  puntajePertinencia: number
  setPuntajePertinencia: (v: number) => void
  puntajeRS: number
  setPuntajeRS: (v: number) => void
}

export default function EvaluacionProyectoCard({
  puntajeTotal,
  porcentaje,
  aprobado,
  puntajeDiagnostico,
  puntajePertinencia,
  setPuntajePertinencia,
  puntajeRS,
  setPuntajeRS,
}: Props) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Evaluación del Proyecto</h3>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            Calificación basada en criterios técnicos
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>
            {puntajeTotal}/35
          </div>
          <div style={{ color: aprobado ? 'green' : 'red' }}>
            {aprobado ? 'Aprobado' : 'No aprobado'}
          </div>
        </div>
      </div>

      <Bar value={porcentaje} color="#22c55e" />

      <ScoreItem title="Diagnóstico" value={puntajeDiagnostico} max={5} />

      <ScoreInput
        title="Pertinencia"
        value={puntajePertinencia}
        max={15}
        onChange={setPuntajePertinencia}
      />

      <ScoreInput
        title="Rentabilidad Social (RS)"
        value={puntajeRS}
        max={15}
        onChange={setPuntajeRS}
      />
    </div>
  )
}

function ScoreItem({
  title,
  value,
  max,
}: {
  title: string
  value: number
  max: number
}) {
  return (
    <div style={{ marginTop: 12 }}>
      {title}: {value}/{max}
    </div>
  )
}

function ScoreInput({
  title,
  value,
  max,
  onChange,
}: {
  title: string
  value: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div style={{ marginTop: 12 }}>
      {title}: 
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ marginLeft: 10, width: 60 }}
      />
      / {max}
    </div>
  )
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 8, background: '#e5e7eb', marginTop: 10 }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  )
}

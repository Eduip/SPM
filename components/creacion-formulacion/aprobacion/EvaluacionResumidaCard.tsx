import { cardStyle } from '../shared'
import type { PostulacionProyecto } from '../../../lib/formulacion-types'

export default function EvaluacionResumidaCard({
  postulacion,
}: {
  postulacion: PostulacionProyecto | null
}) {
  const total = Number(postulacion?.puntaje_total ?? 0)
  const porcentaje = Number(postulacion?.porcentaje_evaluacion ?? 0)

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Evaluación Resumida
      </h3>

      <div
        style={{
          borderRadius: 16,
          padding: 18,
          background: '#ecfdf5',
          border: '1px solid #bbf7d0',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: '#166534', marginBottom: 6 }}>
          Puntaje Total
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#166534' }}>
          {total} / 35
        </div>
        <div
          style={{
            marginTop: 10,
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: 'var(--border-strong)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${porcentaje}%`,
              height: '100%',
              background: 'var(--success)',
            }}
          />
        </div>
      </div>

      <Criterion label="Diagnóstico" value="5 / 5" color="var(--success)" width={100} />
      <Criterion label="Pertinencia" value="11 / 15" color="#3b82f6" width={73} />
      <Criterion label="Rentabilidad Social" value="11 / 15" color="#3b82f6" width={73} />
    </div>
  )
}

function Criterion({
  label,
  value,
  color,
  width,
}: {
  label: string
  value: string
  color: string
  width: number
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 999,
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}

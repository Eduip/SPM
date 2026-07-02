import { cardStyle } from '../shared'
import type { DiagnosticoProyecto } from '../../../lib/formulacion-types'

export default function InformacionComplementariaCard({
  diagnostico,
}: {
  diagnostico: DiagnosticoProyecto | null
}) {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Problema del Proyecto
      </h3>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--primary-soft)',
          background: 'var(--primary-tint)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 6 }}>
          Problema Central
        </div>
        <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
          {diagnostico?.problema_central ?? 'Sin información de problemática.'}
        </div>
      </div>
    </div>
  )
}

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
        Información Complementaria
      </h3>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #dbeafe',
          background: '#eff6ff',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
          Documento Principal
        </div>
        <div style={{ fontSize: 15, color: '#111827' }}>
          Informe Técnico Preliminar.pdf
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #bbf7d0',
          background: '#ecfdf5',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
          Estado Administrativo
        </div>
        <div style={{ fontSize: 15, color: '#111827' }}>
          Certificación Alcaldicia finalizada
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #fde68a',
          background: '#fffbeb',
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
          Problemática Resumida
        </div>
        <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
          {diagnostico?.problema_central ?? 'Sin información de problemática.'}
        </div>
      </div>
    </div>
  )
}

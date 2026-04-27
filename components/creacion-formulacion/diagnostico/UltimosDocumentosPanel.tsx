import { cardStyle } from '../shared'

const docs = [
  'Informe de Avance Mar.',
  'Estado de Pago N°1 apr',
  'Acta Entrega de Terreno',
  'Carta Aprobación Muni',
]

export default function UltimosDocumentosPanel() {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 18, fontWeight: 700 }}>
        Últimos Documentos
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((doc, index) => (
          <div
            key={doc}
            style={{
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                {doc}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                {index === 0
                  ? '15 Mar 2024'
                  : index === 1
                  ? '12 Mar 2024'
                  : index === 2
                  ? '08 Mar 2024'
                  : '05 Mar 2024'}
              </div>
            </div>

            <div style={{ color: '#9ca3af' }}>👁</div>
          </div>
        ))}
      </div>
    </div>
  )
}
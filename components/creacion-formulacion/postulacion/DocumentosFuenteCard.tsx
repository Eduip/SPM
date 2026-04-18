import { cardStyle } from '../shared'
import type { DocumentoFuente } from '../../../lib/formulacion-types'

type Props = {
  documentos: DocumentoFuente[]
  selectedFuenteId: string
}

export default function DocumentosFuenteCard({
  documentos,
  selectedFuenteId,
}: Props) {
  const documentosFuente = selectedFuenteId
    ? documentos.filter((documento) => documento.fuente_id === selectedFuenteId)
    : []

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 14, fontSize: 18, fontWeight: 700 }}>
        Documentos Requeridos
      </h3>

      {!selectedFuenteId ? (
        <EmptyState text="Selecciona una fuente para ver sus documentos requeridos." />
      ) : documentosFuente.length === 0 ? (
        <EmptyState text="Esta fuente no tiene documentos requeridos configurados." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documentosFuente.map((documento) => (
            <div
              key={documento.id}
              style={{
                borderRadius: 14,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {documento.nombre}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280' }}>
                {documento.obligatorio ? 'Obligatorio' : 'Opcional'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px dashed #cbd5e1',
        background: '#f9fafb',
        padding: '14px 16px',
        color: '#6b7280',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {text}
    </div>
  )
}

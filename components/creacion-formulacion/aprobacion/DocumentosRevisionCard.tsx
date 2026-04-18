import { cardStyle } from '../shared'
import type {
  CatalogoDocumentoFormulacion,
  DocumentoAprobacion,
} from '../../../lib/formulacion-types'

export default function DocumentosRevisionCard({
  requeridos,
  documentos,
}: {
  requeridos: CatalogoDocumentoFormulacion[]
  documentos: DocumentoAprobacion[]
}) {
  const documentosMap = new Map(documentos.map((doc) => [getRequirementId(doc), doc]))

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Documentos
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requeridos.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            No hay documentos requeridos configurados para esta fuente.
          </div>
        ) : (
          requeridos.map((item) => {
            const documento = documentosMap.get(item.id)
            const subido = Boolean(documento)

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {item.nombre}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#6b7280' }}>
                    {documento?.nombre_archivo ?? (item.obligatorio ? 'Obligatorio' : 'Opcional')}
                  </div>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '7px 10px',
                    background: subido ? '#dcfce7' : '#fee2e2',
                    color: subido ? '#166534' : '#b91c1c',
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {subido ? 'Subido' : 'Faltante'}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function getRequirementId(doc: DocumentoAprobacion) {
  if (doc.catalogo_documento_id) return doc.catalogo_documento_id

  const prefix = 'documento_fuente_id:'

  if (doc.observacion?.startsWith(prefix)) {
    return doc.observacion.slice(prefix.length)
  }

  return ''
}

'use client'

import { useMemo, useState } from 'react'
import type { CatalogoDocumento, DocumentoProyecto } from '../../../app/creacion-formulacion/documentos/page'
import { uploadDocumentoProyecto } from '../../../app/creacion-formulacion/documentos/actions'
import AlertasActivasPanel from '../diagnostico/AlertasActivasPanel'
import UltimosDocumentosPanel from '../diagnostico/UltimosDocumentosPanel'
import EstadoDocumentacionPanel from './EstadoDocumentacionPanel'
import { cardStyle } from '../shared'
import DocumentosSubidosPanel from './DocumentosSubidosPanel'
import DocumentosProgressPanel from './DocumentosProgressPanel'



type Props = {
  proyectoId: string
  catalogo: CatalogoDocumento[]
  documentos: DocumentoProyecto[]
}

export default function DocumentosContainer({
  proyectoId,
  catalogo,
  documentos,
}: Props) {
  const [uploadedDocumentos, setUploadedDocumentos] = useState<DocumentoProyecto[]>([])
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const currentDocumentos = useMemo(
    () => mergeDocumentos(documentos, uploadedDocumentos),
    [documentos, uploadedDocumentos]
  )

  const documentoMap = useMemo(() => {
    const map = new Map<string, DocumentoProyecto>()
    for (const doc of currentDocumentos) {
        if (doc.catalogo_documento_id && !map.has(doc.catalogo_documento_id)) {
            map.set(doc.catalogo_documento_id, doc)
      }
    }
    return map
  }, [currentDocumentos])

  const rows = catalogo.map((item) => {
    const existing = documentoMap.get(item.id)

    let estado = 'Faltante'
    if (existing?.estado_revision === 'pendiente_revision') estado = 'Pendiente de revisión'
    else if (existing) estado = 'Subido correctamente'

    return {
      catalogoId: item.id,
      nombre: item.nombre,
      tipo: item.tipo,
      obligatorio: item.obligatorio,
      subidoPor: existing?.profile?.[0]?.nombre_completo ?? '-',
      fechaSubida: existing?.fecha_subida ?? '',
      estado,
      porcentajeValidacion: existing?.porcentaje_validacion ?? 0,
    }
  })

  const total = rows.filter((r) => r.obligatorio).length
  const subidos = rows.filter((r) => r.obligatorio && r.estado === 'Subido correctamente').length
  const pendientes = rows.filter((r) => r.obligatorio && r.estado === 'Pendiente de revisión').length
  const faltantes = rows.filter((r) => r.obligatorio && r.estado === 'Faltante').length

  const progreso = total ? Math.round((subidos / total) * 100) : 0

  const handleUpload = async () => {
    if (!selectedCatalogId || !file) {
      setMessage('Selecciona un documento del catálogo y un archivo.')
      return
    }

    const selected = catalogo.find((c) => c.id === selectedCatalogId)
    if (!selected) {
      setMessage('No se encontró el documento seleccionado.')
      return
    }

    setUploading(true)
    setMessage('')

    const fd = new FormData()
    fd.append('proyectoId', proyectoId)
    fd.append('catalogoId', selected.id)
    fd.append('nombre', selected.nombre)
    fd.append('tipoDocumento', selected.tipo)
    fd.append('obligatorio', String(selected.obligatorio))
    fd.append('file', file)

    const result = await uploadDocumentoProyecto(fd)

    if (!result.success) {
      setMessage(result.error || 'No se pudo subir el documento.')
      setUploading(false)
      return
    }

    setMessage('Documento subido correctamente.')
    if (result.documento) {
      setUploadedDocumentos((prev) => mergeDocumentos([result.documento], prev))
    }
    setSelectedCatalogId('')
    setFile(null)
    setFileInputKey((value) => value + 1)
    setUploading(false)
  }

  return (
    <>
      {message && (
        <div
          style={{
            borderRadius: 16,
            padding: '16px 18px',
            background: message.includes('correctamente') ? '#ecfdf5' : '#fef2f2',
            border: message.includes('correctamente') ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: message.includes('correctamente') ? '#166534' : '#b91c1c',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          borderRadius: 16,
          border: '1px solid #fde68a',
          background: '#fffbeb',
          color: '#92400e',
          padding: '16px 18px',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Suba los documentos obligatorios y necesarios para respaldar la formulación del proyecto.
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
          Puede adjuntar archivos en formato PDF, Word, Excel o imágenes.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                  Documentos Obligatorios a Subir
                </h3>
                <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
                  Gestione los documentos requeridos para el proyecto
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Subiendo...' : 'Subir Documento'}
              </button>
            </div>

            <div
              style={{
                borderRadius: 16,
                background: '#f8fafc',
                border: '1px solid #dbeafe',
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                  Progreso de Documentación
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>
                  {progreso}%
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                {subidos} de {total} documentos obligatorios subidos
              </div>

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
                    width: `${progreso}%`,
                    height: '100%',
                    background: '#2563eb',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <select
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid #d1d5db',
                  padding: '0 14px',
                  fontSize: 14,
                }}
              >
                <option value="">Selecciona un documento</option>
                {catalogo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>

              <input
                key={fileInputKey}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: '1px solid #d1d5db',
                  padding: '10px 14px',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                borderRadius: 18,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                  gap: 12,
                  padding: '14px 16px',
                  background: '#f9fafb',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <div>Documento</div>
                <div>Tipo</div>
                <div>Subido por</div>
                <div>Estado</div>
              </div>

              {rows.map((row) => (
                <div
                  key={row.catalogoId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                    gap: 12,
                    padding: '16px',
                    borderTop: '1px solid #e5e7eb',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {row.nombre}
                    </div>
                    {row.obligatorio && (
                      <div style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>
                        * Obligatorio
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 28,
                        padding: '0 10px',
                        borderRadius: 999,
                        background: '#f3f4f6',
                        fontSize: 13,
                        color: '#374151',
                        fontWeight: 600,
                      }}
                    >
                      {row.tipo}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    {row.subidoPor || '-'}
                  </div>

                  <div>
                    <EstadoBadge estado={row.estado} />
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                borderRadius: 14,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: 14,
                fontSize: 14,
                color: '#1d4ed8',
                lineHeight: 1.6,
              }}
            >
              <strong>Formatos aceptados</strong>
              <br />
              Los documentos pueden ser subidos en formato PDF, Word (.doc, .docx), Excel (.xls, .xlsx) o imágenes (.jpg, .png). El tamaño máximo por archivo es de 10 MB.
            </div>
          </div>
          <DocumentosSubidosPanel documentos={currentDocumentos} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
  <EstadoDocumentacionPanel
    total={total}
    subidos={subidos}
    pendientes={pendientes}
    faltantes={faltantes}
  />
  <AlertasActivasPanel />
  <DocumentosProgressPanel
    proyectoId={proyectoId}
    total={total}
    subidos={subidos}
    faltantes={faltantes}
  />
  <UltimosDocumentosPanel />
</div>
      </div>
    </>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const config =
    estado === 'Subido correctamente'
      ? { bg: '#dcfce7', color: '#16a34a' }
      : estado === 'Pendiente de revisión'
      ? { bg: '#fef3c7', color: '#ca8a04' }
      : { bg: '#fee2e2', color: '#dc2626' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {estado}
    </span>
  )
}

function mergeDocumentos(
  incoming: DocumentoProyecto[],
  existing: DocumentoProyecto[]
) {
  const byCatalogOrId = new Map<string, DocumentoProyecto>()

  for (const doc of [...existing, ...incoming]) {
    const key = doc.catalogo_documento_id ?? doc.id
    const current = byCatalogOrId.get(key)

    if (!current || isNewerDocument(doc, current)) {
      byCatalogOrId.set(key, doc)
    }
  }

  return Array.from(byCatalogOrId.values()).sort(
    (a, b) =>
      new Date(b.fecha_subida).getTime() - new Date(a.fecha_subida).getTime()
  )
}

function isNewerDocument(a: DocumentoProyecto, b: DocumentoProyecto) {
  return new Date(a.fecha_subida).getTime() >= new Date(b.fecha_subida).getTime()
}

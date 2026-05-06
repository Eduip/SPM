'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Image as ImageIcon, Sparkles } from 'lucide-react'
import { generarVisualizacionProyecto } from '../../app/cartera-proyectos/actions/visualizations'

type VisualizationData = {
  referenceUrl: string
  generatedUrls: string[]
  referencePrompt: string
  userInstructions: string
  generatedAt: string
}

export default function ProjectVisualizationCard({
  projectId,
  projectName,
  initialVisualization,
  suggestedInstructions = '',
  editable = true,
}: {
  projectId: string
  projectName: string
  initialVisualization: VisualizationData | null
  suggestedInstructions?: string
  editable?: boolean
}) {
  const [instructions, setInstructions] = useState(
    getInitialInstructions(initialVisualization?.userInstructions, suggestedInstructions)
  )
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [visualization, setVisualization] = useState<VisualizationData | null>(
    initialVisualization
  )
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedViewerImage, setSelectedViewerImage] = useState<{
    src: string
    title: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const referenceUrl = useMemo(
    () => previewUrl || visualization?.referenceUrl || '',
    [previewUrl, visualization?.referenceUrl]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (file: File | null) => {
    setSelectedImage(file)
    setError('')

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleGenerate = () => {
    setError('')
    setNotice('')

    startTransition(async () => {
      let imageBase64: string | null = null
      let imageMimeType: string | null = null
      let imageName: string | null = null

      if (selectedImage) {
        const preparedImage = await prepareImagePayload(selectedImage)
        imageBase64 = preparedImage.base64
        imageMimeType = preparedImage.mimeType
        imageName = selectedImage.name
      }

      const result = await generarVisualizacionProyecto({
        projectId,
        userInstructions: instructions,
        imageBase64,
        imageMimeType,
        imageName,
      })

      if (!result.success) {
        setError(result.error || 'No se pudo generar la visualización.')
        return
      }

      if (!('visualization' in result) || !result.visualization) {
        setError('La IA no devolvió una visualización utilizable.')
        return
      }

      setVisualization(result.visualization)
      setNotice('Visualización generada correctamente.')
    })
  }

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: 24,
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: 6,
            }}
          >
            VERSIÓN 3.6
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text-strong)',
            }}
          >
            Visualización Referencial IA
          </h3>
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: 760,
            }}
          >
            {editable
              ? 'Sube una imagen actual del lugar y genera una propuesta visual conceptual del proyecto. Esta vista es referencial y está pensada para presentación.'
              : 'Visualización referencial del proyecto para consulta y presentación.'}
          </p>
        </div>

        <div
          style={{
            minWidth: 160,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            Proyecto
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
            {projectName}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: editable
            ? 'minmax(0, 1.3fr) minmax(320px, 0.9fr)'
            : '1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <ImagePanel
            title="Estado actual"
            subtitle="Imagen base del lugar"
            src={referenceUrl}
            emptyText="Aún no hay imagen de referencia cargada."
            onOpen={(src) => setSelectedViewerImage({ src, title: 'Estado actual' })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {visualization?.generatedUrls?.length ? (
                visualization.generatedUrls.map((url, index) => (
                  <ImagePanel
                    key={url}
                    title={`Propuesta ${index + 1}`}
                    subtitle="Click para ampliar"
                    src={url}
                    emptyText=""
                    onOpen={(src) =>
                      setSelectedViewerImage({ src, title: `Propuesta ${index + 1}` })
                    }
                  />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1' }}>
                  <ImagePanel
                    title="Propuestas IA"
                    subtitle="Visualizaciones conceptuales generadas"
                    src=""
                    emptyText="Genera la propuesta para ver los resultados."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {editable ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              borderRadius: 18,
              border: '1px solid var(--border)',
              background: 'var(--surface-muted)',
              padding: 16,
            }}
          >
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            Imagen base del lugar
            <div
              style={{
                borderRadius: 14,
                border: '1px dashed var(--border-strong)',
                background: '#fff',
                padding: 14,
              }}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                style={{ width: '100%' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                Puedes volver a subir otra imagen para regenerar la propuesta.
              </div>
            </div>
          </label>

          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            Qué se quiere mostrar
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="El sistema sugerirá un prompt según la descripción del proyecto, y luego puedes ajustarlo si quieres."
              style={{
                width: '100%',
                minHeight: 130,
                borderRadius: 14,
                border: '1px solid var(--border-strong)',
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text-strong)',
                resize: 'vertical',
                boxSizing: 'border-box',
                background: '#fff',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                La sugerencia toma como base la descripción y el contexto del proyecto.
              </div>
              {suggestedInstructions.trim() ? (
                <button
                  type="button"
                  onClick={() => setInstructions(suggestedInstructions)}
                  style={{
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-strong)',
                    background: '#fff',
                    color: 'var(--text-strong)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Restaurar sugerencia
                </button>
              ) : null}
            </div>
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending}
              style={{
                height: 42,
                borderRadius: 12,
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                padding: '0 16px',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <Sparkles size={15} />
              {isPending ? 'Generando...' : 'Generar propuesta'}
            </button>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Usa una foto clara del lugar para obtener un mejor resultado.
            </div>
          </div>

          {notice ? (
            <div
              style={{
                borderRadius: 12,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                padding: '10px 12px',
                fontSize: 13,
              }}
            >
              {notice}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                borderRadius: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 12px',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          </div>
        ) : null}
      </div>
      {selectedViewerImage ? (
        <div
          onClick={() => setSelectedViewerImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            zIndex: 2000,
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1200px, 100%)',
              maxHeight: '90vh',
              background: '#fff',
              borderRadius: 20,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
                {selectedViewerImage.title}
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewerImage(null)}
                style={{
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  padding: '0 12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Cerrar
              </button>
            </div>
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: 'calc(90vh - 90px)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedViewerImage.src}
                alt={selectedViewerImage.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 'calc(90vh - 90px)',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function getInitialInstructions(
  savedInstructions?: string | null,
  suggestedInstructions?: string | null
) {
  if (savedInstructions?.trim()) return savedInstructions
  return suggestedInstructions?.trim() ?? ''
}

function ImagePanel({
  title,
  subtitle,
  src,
  emptyText,
  onOpen,
}: {
  title: string
  subtitle: string
  src: string
  emptyText: string
  onOpen?: (src: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>

      <div
        onClick={() => {
          if (src && onOpen) onOpen(src)
        }}
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#f8fafc',
          aspectRatio: '4 / 3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: src && onOpen ? 'zoom-in' : 'default',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: 20,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <ImageIcon size={34} />
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{emptyText}</div>
          </div>
        )}
      </div>
    </div>
  )
}

async function prepareImagePayload(file: File) {
  const dataUrl = await fileToDataUrl(file)
  const resized = await resizeImage(dataUrl)
  return {
    base64: resized.base64,
    mimeType: 'image/jpeg',
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('No se pudo leer la imagen.'))
    }
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function resizeImage(dataUrl: string) {
  return new Promise<{ base64: string }>((resolve, reject) => {
    const image = new window.Image()

    image.onload = () => {
      const maxWidth = 1280
      const scale = image.width > maxWidth ? maxWidth / image.width : 1
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('No se pudo preparar la imagen.'))
        return
      }

      context.drawImage(image, 0, 0, width, height)
      const output = canvas.toDataURL('image/jpeg', 0.78)
      resolve({ base64: output.split(',')[1] ?? '' })
    }

    image.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
    image.src = dataUrl
  })
}

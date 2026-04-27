'use client'

import { useRef, useState } from 'react'
import { uploadDiagnosticoDocumento } from '../../../app/creacion-formulacion/diagnostico/actions'
import type { DiagnosticoDocumento } from './DiagnosticoFormContainer'

type Props = {
    proyectoId: string
    value: string
    onChange: (value: string) => void
    documentos: DiagnosticoDocumento[]
  }
  
  export default function JustificacionCard({
    proyectoId,
    value,
    onChange,
    documentos,
  }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploadedDocumentos, setUploadedDocumentos] = useState<
      DiagnosticoDocumento[]
    >([])
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')
    const currentDocumentos = [...uploadedDocumentos, ...documentos]

    const handleSelectFile = () => {
      inputRef.current?.click()
    }

    const handleUpload = async (file: File | null) => {
      if (!file) return

      setUploading(true)
      setMessage('')

      const formData = new FormData()
      formData.append('proyectoId', proyectoId)
      formData.append('file', file)

      const result = await uploadDiagnosticoDocumento(formData)

      if (!result.success) {
        setMessage(result.error || 'No se pudo subir el documento.')
        setUploading(false)
        return
      }

      if (result.documento) {
        setUploadedDocumentos((prev) => [result.documento, ...prev])
      }

      setMessage('Documento de respaldo subido correctamente.')
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }

    return (
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 18,
          border: '1px solid var(--border)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-strong)',
            }}
          >
            Justificación del Proyecto
          </h3>
  
          <div style={{ color: 'var(--primary)', fontSize: 18 }}>✎</div>
        </div>
  
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 220,
            borderRadius: 16,
            background: '#f9fafb',
            border: '1px solid var(--border)',
            padding: 20,
            fontSize: 15,
            color: 'var(--text)',
            lineHeight: 1.7,
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: 18,
          }}
        />
  
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-strong)',
              marginBottom: 12,
            }}
          >
            Documentos de Respaldo
          </div>
  
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {message ? (
              <div
                style={{
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: message.includes('correctamente')
                    ? '#ecfdf5'
                    : '#fef2f2',
                  border: message.includes('correctamente')
                    ? '1px solid #bbf7d0'
                    : '1px solid #fecaca',
                  color: message.includes('correctamente') ? '#166534' : '#b91c1c',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {message}
              </div>
            ) : null}

            {currentDocumentos.length ? (
              currentDocumentos.map((documento, index) => (
                <DocItem
                  key={documento.id}
                  title={documento.nombre_archivo || documento.nombre}
                  subtitle={`${formatFileSize(
                    documento.tamano_bytes
                  )} • ${formatUploadDate(documento.fecha_subida)}`}
                  bg={index % 2 === 0 ? 'var(--primary-tint)' : '#ecfdf5'}
                  color={index % 2 === 0 ? 'var(--primary)' : 'var(--success)'}
                />
              ))
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px dashed #cbd5e1',
                  background: '#f9fafb',
                  padding: '14px 16px',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                No hay documentos de respaldo adjuntos.
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
            />
  
            <button
              type="button"
              onClick={handleSelectFile}
              disabled={uploading}
              style={{
                height: 52,
                borderRadius: 16,
                border: '1px dashed #cbd5e1',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: uploading ? 0.7 : 1,
              }}
            >
              📄&nbsp;&nbsp;{uploading ? 'Subiendo...' : 'Adjuntar documento de respaldo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return 'Tamaño no disponible'

    const mb = bytes / 1024 / 1024

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  function formatUploadDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible'
    }

    return `Subido el ${date.toLocaleDateString('es-CL')}`
  }
  
  function DocItem({
    title,
    subtitle,
    bg,
    color,
  }: {
    title: string
    subtitle: string
    bg: string
    color: string
  }) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: '14px 16px',
          background: bg,
          border: `1px solid ${bg}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'var(--surface)',
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          📄
        </div>
  
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-strong)',
              marginBottom: 2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    )
  }

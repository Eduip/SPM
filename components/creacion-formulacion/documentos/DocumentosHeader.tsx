'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StageBackButton from '../StageBackButton'
import { marcarDocumentosCompletados } from '../../../app/creacion-formulacion/documentos/complete-actions'

export default function DocumentosHeader({ proyectoId }: { proyectoId: string }) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
      setSaving(true)

      const result = await marcarDocumentosCompletados(proyectoId)

      setSaving(false)

      if (!result.success) {
        alert(result.error || 'No se pudo guardar la etapa de documentos.')
        return
      }

      alert('Documentos guardados correctamente.')
      router.refresh()
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Creación y Formulación de Proyectos
        </h1>
  
        <div style={{ display: 'flex', gap: 12 }}>
          <StageBackButton
            href={`/creacion-formulacion/postulacion?proyectoId=${proyectoId}`}
          />

          <button
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 14,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ✕&nbsp;&nbsp;Cancelar
          </button>
  
          <button
            onClick={handleSave}
            disabled={saving || !proyectoId}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 14,
              border: 'none',
              background: saving || !proyectoId ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: saving || !proyectoId ? 'not-allowed' : 'pointer',
              boxShadow:
                saving || !proyectoId
                  ? 'none'
                  : '0 10px 18px rgba(37, 99, 235, 0.18)',
            }}
          >
            💾&nbsp;&nbsp;{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    )
  }

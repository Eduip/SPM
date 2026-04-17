'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cardStyle } from '../shared'
import { aprobarProyecto } from '../../../app/creacion-formulacion/aprobacion/actions'

export default function AprobacionPanel({
  proyectoId,
  puedeAprobar,
  yaAprobado,
}: {
  proyectoId: string
  puedeAprobar: boolean
  yaAprobado: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleAprobar = async () => {
    setMessage('')

    if (yaAprobado) {
      router.push('/cartera-proyectos')
      return
    }

    if (!puedeAprobar) {
      setMessage('Aún faltan requisitos para aprobar este proyecto.')
      return
    }

    setSaving(true)

    const result = await aprobarProyecto(proyectoId)
    setSaving(false)

    if (!result.success) {
      setMessage(result.error || 'No se pudo aprobar el proyecto.')
      return
    }

    setMessage('Proyecto aprobado correctamente.')
    router.push('/cartera-proyectos')
  }

  return (
    <div style={cardStyle}>
      <button
        onClick={handleAprobar}
        disabled={saving || (!puedeAprobar && !yaAprobado)}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 14,
          border: 'none',
          background: yaAprobado ? '#2563eb' : puedeAprobar ? '#16a34a' : '#86efac',
          color: '#ffffff',
          fontWeight: 700,
          cursor: saving || (!puedeAprobar && !yaAprobado) ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Aprobando...' : yaAprobado ? 'Volver a cartera' : 'Aprobar Proyecto'}
      </button>

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        {yaAprobado
          ? 'Este proyecto ya está aprobado.'
          : puedeAprobar
          ? 'Esta acción aprobará el proyecto y lo enviará a la cartera.'
          : 'Revise los requisitos pendientes antes de aprobar.'}
      </div>

      {message && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            padding: 12,
            background: message.includes('correctamente') ? '#ecfdf5' : '#fef2f2',
            border: message.includes('correctamente') ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: message.includes('correctamente') ? '#166534' : '#b91c1c',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            marginBottom: 8,
            fontWeight: 600,
            color: '#4b5563',
          }}
        >
          <span>Progreso de formulación</span>
          <span style={{ color: '#16a34a' }}>100%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#16a34a',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          5 de 5 secciones completadas
        </div>
      </div>
    </div>
  )
}

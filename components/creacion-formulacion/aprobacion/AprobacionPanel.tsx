'use client'

import { useRouter } from 'next/navigation'
import { cardStyle } from '../shared'
import { aprobarProyecto } from '../../../app/creacion-formulacion/aprobacion/actions'

export default function AprobacionPanel({
  proyectoId,
  puedeAprobar,
}: {
  proyectoId: string
  puedeAprobar: boolean
}) {
  const router = useRouter()

  const handleAprobar = async () => {
    if (!puedeAprobar) return

    const result = await aprobarProyecto(proyectoId)

    if (!result.success) {
      alert(result.error || 'No se pudo aprobar el proyecto.')
      return
    }

    router.push('/cartera-proyectos')
  }

  return (
    <div style={cardStyle}>
      <button
        onClick={handleAprobar}
        disabled={!puedeAprobar}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 14,
          border: 'none',
          background: puedeAprobar ? '#16a34a' : '#86efac',
          color: '#ffffff',
          fontWeight: 700,
          cursor: puedeAprobar ? 'pointer' : 'not-allowed',
        }}
      >
        Aprobar Proyecto
      </button>

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        Esta acción requiere confirmación adicional.
      </div>

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
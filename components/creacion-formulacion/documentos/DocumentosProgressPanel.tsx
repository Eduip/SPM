'use client'

import { useRouter } from 'next/navigation'
import { cardStyle } from '../shared'
import { marcarDocumentosCompletados } from '../../../app/creacion-formulacion/documentos/complete-actions'

export default function DocumentosProgressPanel({
  proyectoId,
  total,
  faltantes,
}: {
  proyectoId: string
  total: number
  subidos: number
  faltantes: number
}) {
  const router = useRouter()
  const bypassValidacionDocumental = true
const completo = bypassValidacionDocumental || (total > 0 && faltantes === 0)
  const progreso = 80

  const handleContinuar = async () => {
    if (!completo) return

    const result = await marcarDocumentosCompletados(proyectoId)

    if (!result.success) {
      alert(result.error || 'No se pudo completar la etapa de documentos.')
      return
    }

    router.push(`/creacion-formulacion/aprobacion?proyectoId=${proyectoId}`)
  }

  return (
    <div style={cardStyle}>
      <div
        style={{
          borderRadius: 18,
          background: '#eff6ff',
          border: '1px solid #dbeafe',
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: 8,
          }}
        >
          ¿Completó la documentación?
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: '#4b5563',
            marginBottom: 18,
          }}
        >
          Continúe a la siguiente etapa para enviar el proyecto a revisión y aprobación final.
        </div>

        <button
          onClick={handleContinuar}
          disabled={!completo}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 14,
            border: 'none',
            background: completo ? '#2563eb' : '#93c5fd',
            color: '#ffffff',
            fontWeight: 700,
            cursor: completo ? 'pointer' : 'not-allowed',
            boxShadow: completo ? '0 10px 18px rgba(37,99,235,0.20)' : 'none',
            marginBottom: 12,
          }}
        >
          Continuar a Aprobación →
        </button>

        <button
          style={{
            width: '100%',
            height: 46,
            borderRadius: 14,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Guardar y volver al listado
        </button>
      </div>

      <div>
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
          <span style={{ color: '#2563eb' }}>{progreso}%</span>
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
              width: `${progreso}%`,
              height: '100%',
              background: '#2563eb',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          4 de 5 secciones completadas
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { cardStyle } from '../shared'

export default function PostulacionProgressPanel({
  proyectoId,
}: {
  proyectoId: string
}) {
  const router = useRouter()

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
          ¿Completó la postulación?
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: '#4b5563',
            marginBottom: 18,
          }}
        >
          Continúe a la siguiente etapa para adjuntar los documentos requeridos del proyecto.
        </div>

        <button
          onClick={() =>
            router.push(
              `/creacion-formulacion/documentos?proyectoId=${proyectoId}`
            )
          }
          style={{
            width: '100%',
            height: 50,
            borderRadius: 14,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 18px rgba(37,99,235,0.20)',
            marginBottom: 12,
          }}
        >
          Continuar a Documentos →
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
          <span style={{ color: '#2563eb' }}>60%</span>
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
              width: '60%',
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
          3 de 5 secciones completadas
        </div>
      </div>
    </div>
  )
}
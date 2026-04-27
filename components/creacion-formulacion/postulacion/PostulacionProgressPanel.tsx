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
          background: 'var(--primary-tint)',
          border: '1px solid var(--primary-soft)',
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
            background: 'var(--primary)',
            color: 'var(--primary-contrast)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 18px var(--focus-ring)',
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
            border: '1px solid var(--border-strong)',
            background: 'var(--surface)',
            color: 'var(--text)',
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
          <span style={{ color: 'var(--primary)' }}>60%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: 'var(--border)',
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: '60%',
              height: '100%',
              background: 'var(--primary)',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          3 de 5 secciones completadas
        </div>
      </div>
    </div>
  )
}
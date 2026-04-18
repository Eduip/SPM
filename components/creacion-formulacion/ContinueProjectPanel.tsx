'use client'

import { useRouter } from 'next/navigation'
import { cardStyle } from './shared'

export type ContinueProject = {
  id: string
  codigo_interno: string | null
  nombre: string | null
  etapa_formulacion_actual: number | null
  porcentaje_formulacion: number | null
  updated_at: string | null
  unidad?: { nombre?: string | null } | null
}

export default function ContinueProjectPanel({
  proyectos,
}: {
  proyectos: ContinueProject[]
}) {
  const router = useRouter()

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
            Continuar proyecto en formulación
          </h3>
          <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
            Retome un proyecto guardado sin volver a ingresar los datos desde cero.
          </div>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <div
          style={{
            borderRadius: 14,
            border: '1px dashed #cbd5e1',
            background: '#f9fafb',
            padding: 16,
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          No hay proyectos en formulación pendientes para continuar.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {proyectos.map((proyecto) => {
            const etapa = normalizeStage(proyecto.etapa_formulacion_actual)

            return (
              <div
                key={proyecto.id}
                style={{
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  padding: 14,
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    {proyecto.nombre || 'Proyecto sin nombre'}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 13, color: '#6b7280' }}>
                    {proyecto.codigo_interno || 'Sin código'} · {proyecto.unidad?.nombre || 'Sin unidad'} · {etapa.label}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      height: 8,
                      borderRadius: 999,
                      background: '#e5e7eb',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Number(proyecto.porcentaje_formulacion ?? 0)}%`,
                        height: '100%',
                        background: '#2563eb',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`${etapa.href}?proyectoId=${proyecto.id}`)}
                  style={{
                    height: 42,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#111827',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Continuar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function normalizeStage(stage: number | null) {
  if (stage === 1) {
    return { label: 'Datos del proyecto', href: '/creacion-formulacion' }
  }

  if (stage === 2) {
    return { label: 'Diagnóstico', href: '/creacion-formulacion/diagnostico' }
  }

  if (stage === 3) {
    return { label: 'Postulación', href: '/creacion-formulacion/postulacion' }
  }

  if (stage === 4) {
    return { label: 'Documentos', href: '/creacion-formulacion/documentos' }
  }

  return { label: 'Aprobación', href: '/creacion-formulacion/aprobacion' }
}

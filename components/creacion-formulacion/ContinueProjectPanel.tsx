'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarProyectoEnFormulacion } from '../../app/creacion-formulacion/actions'
import { cardStyle } from './shared'

export type ContinueProject = {
  id: string
  codigo_interno: string | null
  nombre: string | null
  estado?: string | null
  etapa_formulacion_actual: number | null
  porcentaje_formulacion: number | null
  updated_at: string | null
  unidad?: { nombre?: string | null } | null
}

export default function ContinueProjectPanel({
  proyectos,
  proyectosAprobados = [],
  compact = false,
}: {
  proyectos: ContinueProject[]
  proyectosAprobados?: ContinueProject[]
  compact?: boolean
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleDelete = async (proyecto: ContinueProject) => {
    const shouldDelete = window.confirm(
      `¿Eliminar el proyecto "${proyecto.nombre || 'Proyecto sin nombre'}" de la formulación?`
    )

    if (!shouldDelete) return

    setDeletingId(proyecto.id)
    setErrorMessage('')

    const result = await eliminarProyectoEnFormulacion(proyecto.id)

    if (!result.success) {
      setErrorMessage(result.error || 'No se pudo eliminar el proyecto.')
      setDeletingId('')
      return
    }

    setDeletingId('')
    router.refresh()
  }

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
            Proyectos de Creación y Formulación
          </h3>
          <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
            Revise proyectos aprobados o retome una formulación pendiente.
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/creacion-formulacion?nuevo=1')}
          style={{
            height: 42,
            padding: '0 16px',
            borderRadius: 12,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          + Nuevo Proyecto
        </button>
      </div>

      {compact ? (
        <div
          style={{
            borderRadius: 14,
            border: '1px solid #dbeafe',
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: 14,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Estás trabajando en un proyecto. Para volver al listado, entra a Creación y Formulación desde el menú.
        </div>
      ) : proyectos.length === 0 && proyectosAprobados.length === 0 ? (
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
          No hay proyectos en formulación ni proyectos aprobados para mostrar.
        </div>
      ) : (
        <>
        {errorMessage && (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              padding: 12,
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </div>
        )}

        <ProjectListSection
          title="Proyectos en formulación"
          emptyText="No hay proyectos en formulación pendientes para continuar."
          proyectos={proyectos}
          maxHeight={318}
          renderAction={(proyecto) => {
            const etapa = normalizeStage(proyecto.etapa_formulacion_actual)

            return (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`${etapa.href}?proyectoId=${proyecto.id}`)}
                  style={primaryActionStyle}
                >
                  Continuar
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(proyecto)}
                  disabled={deletingId === proyecto.id}
                  style={{
                    ...dangerActionStyle,
                    cursor: deletingId === proyecto.id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === proyecto.id ? 0.7 : 1,
                  }}
                >
                  {deletingId === proyecto.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </>
            )
          }}
        />

        <ProjectListSection
          title="Proyectos aprobados"
          emptyText="No hay proyectos aprobados para consultar."
          proyectos={proyectosAprobados}
          maxHeight={318}
          renderAction={(proyecto) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/creacion-formulacion/aprobacion?proyectoId=${proyecto.id}`)
              }
              style={primaryActionStyle}
            >
              Ver datos
            </button>
          )}
        />
        </>
      )}
    </div>
  )
}

function ProjectListSection({
  title,
  emptyText,
  proyectos,
  maxHeight,
  renderAction,
}: {
  title: string
  emptyText: string
  proyectos: ContinueProject[]
  maxHeight: number
  renderAction: (proyecto: ContinueProject) => React.ReactNode
}) {
  return (
    <section style={{ marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          gap: 12,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>
          {title}
        </h4>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#6b7280' }}>
          {proyectos.length} proyecto{proyectos.length === 1 ? '' : 's'}
        </span>
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
          {emptyText}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 10,
            maxHeight,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
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
                        background:
                          proyecto.estado === 'aprobado' ? '#16a34a' : '#2563eb',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {renderAction(proyecto)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
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

const primaryActionStyle: React.CSSProperties = {
  height: 42,
  padding: '0 16px',
  borderRadius: 12,
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const dangerActionStyle: React.CSSProperties = {
  height: 42,
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid #fecaca',
  background: '#fff7f7',
  color: '#b91c1c',
  fontWeight: 800,
  whiteSpace: 'nowrap',
}

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
  const allProjects = [...proyectos, ...proyectosAprobados]

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

        <ProjectTable
          proyectos={allProjects}
          deletingId={deletingId}
          onContinue={(proyecto) => {
            const etapa = normalizeStage(proyecto.etapa_formulacion_actual)
            router.push(`${etapa.href}?proyectoId=${proyecto.id}`)
          }}
          onView={(proyecto) =>
            router.push(`/creacion-formulacion/aprobacion?proyectoId=${proyecto.id}`)
          }
          onDelete={handleDelete}
        />
        </>
      )}
    </div>
  )
}

function ProjectTable({
  proyectos,
  deletingId,
  onContinue,
  onView,
  onDelete,
}: {
  proyectos: ContinueProject[]
  deletingId: string
  onContinue: (proyecto: ContinueProject) => void
  onView: (proyecto: ContinueProject) => void
  onDelete: (proyecto: ContinueProject) => void
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
          Listado de proyectos
        </h4>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#6b7280' }}>
          {proyectos.length} proyecto{proyectos.length === 1 ? '' : 's'}
        </span>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ maxHeight: 440, overflow: 'auto' }}>
          <div style={tableHeaderStyle}>
            <div>Proyecto</div>
            <div>Unidad</div>
            <div>Etapa</div>
            <div>Estado</div>
            <div>Avance</div>
            <div>Actualización</div>
            <div style={{ textAlign: 'right' }}>Acciones</div>
          </div>

          {proyectos.map((proyecto) => {
            const etapa = normalizeStage(proyecto.etapa_formulacion_actual)
            const progreso = Number(proyecto.porcentaje_formulacion ?? 0)
            const approved = proyecto.estado === 'aprobado'

            return (
              <div key={proyecto.id} style={tableRowStyle}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                    {proyecto.nombre || 'Proyecto sin nombre'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                    {proyecto.codigo_interno || 'Sin código'}
                  </div>
                </div>

                <div style={cellStyle}>{proyecto.unidad?.nombre || 'Sin unidad'}</div>
                <div style={cellStyle}>{etapa.label}</div>
                <div>
                  <StatusBadge proyecto={proyecto} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 82,
                        height: 8,
                        borderRadius: 999,
                        background: '#e5e7eb',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: `${progreso}%`,
                          height: '100%',
                          background: approved ? '#16a34a' : '#2563eb',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 700 }}>
                      {progreso}%
                    </span>
                  </div>
                </div>
                <div style={cellStyle}>
                  {proyecto.updated_at ? formatDate(proyecto.updated_at) : '-'}
                </div>
                <div style={actionsCellStyle}>
                  {approved ? (
                    <button
                      type="button"
                      onClick={() => onView(proyecto)}
                      style={primaryActionStyle}
                    >
                      Ver datos
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onContinue(proyecto)}
                        style={primaryActionStyle}
                      >
                        Continuar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(proyecto)}
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StatusBadge({ proyecto }: { proyecto: ContinueProject }) {
  const approved = proyecto.estado === 'aprobado'
  const label = approved ? 'Aprobado' : 'En formulación'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 10px',
        borderRadius: 999,
        background: approved ? '#dcfce7' : '#dbeafe',
        color: approved ? '#15803d' : '#1d4ed8',
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

const tableColumns =
  'minmax(220px, 2.2fr) minmax(120px, 1.2fr) minmax(110px, 1.1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) 190px'

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: tableColumns,
  gap: 12,
  padding: '13px 14px',
  background: '#f9fafb',
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  position: 'sticky',
  top: 0,
  zIndex: 1,
  minWidth: 1080,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: tableColumns,
  gap: 12,
  padding: '14px',
  borderTop: '1px solid #e5e7eb',
  alignItems: 'center',
  background: '#ffffff',
  minWidth: 1080,
}

const cellStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#374151',
  fontWeight: 600,
}

const actionsCellStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'flex-end',
}

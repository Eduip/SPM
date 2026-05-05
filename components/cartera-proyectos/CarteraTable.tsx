'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { ProyectoCartera } from '../../app/cartera-proyectos/page'
import { eliminarProyectoCartera } from '../../app/cartera-proyectos/actions/projects'

export default function CarteraTable({
  proyectos,
  canDeleteProjects = false,
}: {
  proyectos: ProyectoCartera[]
  canDeleteProjects?: boolean
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleDelete = async (proyecto: ProyectoCartera) => {
    const confirmed = window.confirm(
      `¿Eliminar el proyecto "${proyecto.nombre}" de la cartera? Esta acción lo archivará y dejará de mostrarse en el sistema.`
    )

    if (!confirmed) return

    setDeletingId(proyecto.id)
    setErrorMessage('')

    const result = await eliminarProyectoCartera(proyecto.id)

    if (!result.success) {
      setErrorMessage(result.error || 'No se pudo eliminar el proyecto.')
      setDeletingId('')
      return
    }

    setDeletingId('')
    router.refresh()
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {errorMessage ? (
        <div
          style={{
            margin: 16,
            marginBottom: 0,
            borderRadius: 12,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
            padding: 12,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 2fr 1.3fr 1.3fr 1.3fr 1.3fr 1.5fr 160px',
          gap: 12,
          padding: '14px 16px',
          background: '#f9fafb',
          fontSize: 12,
          fontWeight: 800,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <div>Código</div>
        <div>Proyecto</div>
        <div>Unidad</div>
        <div>Fuente</div>
        <div>Estado</div>
        <div>Avance Físico</div>
        <div>Responsable</div>
        <div>Acciones</div>
      </div>

      {proyectos.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 2fr 1.3fr 1.3fr 1.3fr 1.3fr 1.5fr 160px',
            gap: 12,
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            alignItems: 'center',
          }}
        >
          <div style={cellStyle}>{p.codigo_interno ?? '-'}</div>
          <div style={{ ...cellStyle, fontWeight: 700 }}>{p.nombre}</div>
          <div style={cellStyle}>{p.unidad?.nombre ?? '-'}</div>
          <div style={cellStyle}>{p.fuente?.nombre ?? '-'}</div>
          <div>
            <EstadoBadge proyecto={p} />
          </div>
          <div style={cellStyle}>{p.avance_fisico_actual ?? 0}%</div>
          <div style={cellStyle}>{p.responsable?.nombre_completo ?? '-'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() =>
                router.push(`/cartera-proyectos/${p.id}`)
              }
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Ver
            </button>
            {canDeleteProjects ? (
              <button
                type="button"
                onClick={() => void handleDelete(p)}
                disabled={deletingId === p.id}
                title="Eliminar proyecto"
                aria-label="Eliminar proyecto"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #fecaca',
                  background: deletingId === p.id ? '#fee2e2' : '#fff5f5',
                  color: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: deletingId === p.id ? 'wait' : 'pointer',
                  opacity: deletingId === p.id ? 0.75 : 1,
                }}
              >
                <Trash2 size={15} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function EstadoBadge({ proyecto }: { proyecto: ProyectoCartera }) {
  let label = 'Pendiente'
  let bg = '#f3f4f6'
  let color = '#6b7280'

  if (proyecto.estado === 'aprobado') {
    label = 'Aprobado'
    bg = '#dcfce7'
    color = '#16a34a'
  } else if ((proyecto.avance_fisico_actual ?? 0) > 0) {
    label = 'En Ejecución'
    bg = '#dcfce7'
    color = '#16a34a'
  } else if ((proyecto.porcentaje_formulacion ?? 0) < 100) {
    label = 'En Formulación'
    bg = '#dbeafe'
    color = '#2563eb'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 30,
        padding: '0 12px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  )
}

const cellStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#374151',
}

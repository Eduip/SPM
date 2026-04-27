'use client'

import { useRouter } from 'next/navigation'
import type { ProyectoCartera } from '../../app/cartera-proyectos/page'

export default function CarteraTable({
  proyectos,
}: {
  proyectos: ProyectoCartera[]
}) {
  const router = useRouter()

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 2fr 1.3fr 1.3fr 1.3fr 1.3fr 1.5fr 120px',
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
        <div>Acción</div>
      </div>

      {proyectos.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 2fr 1.3fr 1.3fr 1.3fr 1.3fr 1.5fr 120px',
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
          <div>
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
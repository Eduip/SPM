import { cardStyle } from '../shared'
import type { ProyectoAprobacion } from '../../../lib/formulacion-types'

export default function ResumenEjecutivo({
  proyecto,
}: {
  proyecto: ProyectoAprobacion | null
}) {
  const cards = [
    {
      title: 'Beneficiarios',
      value: '320',
      subtitle: 'vecinos',
      bg: 'var(--primary-tint)',
      color: 'var(--primary)',
    },
    {
      title: 'Avance Formulación',
      value: `${proyecto?.porcentaje_formulacion ?? 0}%`,
      subtitle: 'completado',
      bg: '#ecfdf5',
      color: 'var(--success)',
    },
    {
      title: 'Longitud Total',
      value: '850',
      subtitle: 'metros lineales',
      bg: '#faf5ff',
      color: '#9333ea',
    },
    {
      title: 'Plazo Ejecución',
      value: '12',
      subtitle: 'meses',
      bg: '#fff7ed',
      color: '#ea580c',
    },
  ]

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Resumen Ejecutivo
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              borderRadius: 16,
              padding: 20,
              background: card.bg,
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: card.color,
              }}
            >
              {card.value}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      bg: '#eff6ff',
      color: '#2563eb',
    },
    {
      title: 'Avance Formulación',
      value: `${proyecto?.porcentaje_formulacion ?? 0}%`,
      subtitle: 'completado',
      bg: '#ecfdf5',
      color: '#16a34a',
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
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: '#6b7280',
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
                color: '#6b7280',
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

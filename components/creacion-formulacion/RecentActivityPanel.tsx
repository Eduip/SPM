import { cardStyle } from './shared'

const activities = [
  { text: 'Proyecto creado', time: 'Hace 10 minutos', color: '#2563eb' },
  { text: 'Documento aprobado', time: 'Hace 1 hora', color: '#22c55e' },
  { text: 'Revisión pendiente', time: 'Hace 2 horas', color: '#f97316' },
]

export default function RecentActivityPanel() {
  return (
    <div style={cardStyle}>
      <h3
        style={{
          margin: 0,
          marginBottom: 18,
          fontSize: 18,
          fontWeight: 700,
          color: '#111827',
        }}
      >
        Actividad Reciente
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activities.map((item) => (
          <div
            key={item.text}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: item.color,
                marginTop: 7,
                flexShrink: 0,
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 15,
                  color: '#111827',
                  fontWeight: 500,
                }}
              >
                {item.text}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 14,
                  color: '#6b7280',
                }}
              >
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
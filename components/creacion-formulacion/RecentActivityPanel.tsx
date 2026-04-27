import { cardStyle } from './shared'

const activities = [
  { text: 'Proyecto creado', time: 'Hace 10 minutos', color: 'var(--primary)' },
  { text: 'Documento aprobado', time: 'Hace 1 hora', color: 'var(--success)' },
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
          color: 'var(--text-strong)',
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
                  color: 'var(--text-strong)',
                  fontWeight: 500,
                }}
              >
                {item.text}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 14,
                  color: 'var(--text-muted)',
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
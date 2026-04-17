import { cardStyle } from '../shared'

const alerts = [
  {
    title: 'Boleta de garantía por vencer',
    subtitle: 'Boleta N°185759150 vence en 10 días',
    date: '30 Jun 2024',
    border: '#fecaca',
    bg: '#fff7f7',
  },
  {
    title: 'Garantía próxima a vencer',
    subtitle: 'Boleta N°185759148 vence en 40 días',
    date: '28 Abr 2024',
    border: '#fde68a',
    bg: '#fffdf4',
  },
  {
    title: 'Renovación pendiente',
    subtitle: 'Póliza N°4785 requiere revisión',
    date: '15 Sep 2024',
    border: '#fde68a',
    bg: '#fffdf4',
  },
]

export default function AlertasActivasPanel() {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Alertas Activas
        </h3>
        <div
          style={{
            minWidth: 24,
            height: 24,
            borderRadius: 999,
            background: '#fee2e2',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          1
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {alerts.map((alert) => (
          <div
            key={alert.title}
            style={{
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${alert.border}`,
              background: alert.bg,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 6,
              }}
            >
              {alert.title}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
              {alert.subtitle}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
              {alert.date}
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: 16,
          border: 'none',
          background: 'transparent',
          color: '#2563eb',
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Ver todas →
      </button>
    </div>
  )
}
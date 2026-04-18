import { cardStyle } from '../shared'

type Props = {
  montoTotal: string
  periodo: string
  utmX: string
  utmY: string
}

export default function ResumenProyectoPanel({
  montoTotal,
  periodo,
  utmX,
  utmY,
}: Props) {
  const items = [
    {
      label: 'Monto Total',
      value: montoTotal || '$0',
      sub: 'CLP',
    },
    {
      label: 'Periodo',
      value: periodo || '-',
      sub: 'Año fiscal',
    },
    {
      label: 'Coordenadas',
      value: 'UTM 19S',
      sub: `${utmX || '-'}, ${utmY || '-'}`,
    },
  ]

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 18, fontWeight: 700 }}>
        Resumen del Proyecto
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
              {item.value}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

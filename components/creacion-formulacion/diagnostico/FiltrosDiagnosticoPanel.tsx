import { cardStyle } from '../shared'

const filters = [
  { label: 'Todas', count: 24, active: true },
  { label: 'Formulación', count: 8 },
  { label: 'Ejecución', count: 5 },
  { label: 'Financiamiento', count: 6 },
  { label: 'Rendición', count: 5 },
]

export default function FiltrosDiagnosticoPanel() {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 18, fontWeight: 700 }}>
        Filtros
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filters.map((filter) => (
          <div
            key={filter.label}
            style={{
              height: 44,
              borderRadius: 14,
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: filter.active ? 'var(--primary-tint)' : 'var(--surface)',
              border: filter.active ? '1px solid var(--primary-soft)' : '1px solid transparent',
              color: filter.active ? 'var(--primary)' : 'var(--text)',
              fontWeight: filter.active ? 700 : 600,
            }}
          >
            <span>{filter.label}</span>

            <div
              style={{
                minWidth: 24,
                height: 24,
                borderRadius: 999,
                background: filter.active ? 'var(--primary)' : 'var(--border)',
                color: filter.active ? 'var(--surface)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              {filter.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
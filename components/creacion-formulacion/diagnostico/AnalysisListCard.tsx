import type { DiagnosticoItem } from './DiagnosticoFormContainer'

type Props = {
  title: string
  items: DiagnosticoItem[]
  type: 'causas' | 'consecuencias'
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (
    id: string,
    field: 'title' | 'description',
    value: string
  ) => void
}

export default function AnalysisListCard({
  title,
  items,
  onAdd,
  onRemove,
  onChange,
}: Props) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid #e5e7eb',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {title}
        </h3>

        <button
          onClick={onAdd}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              padding: 16,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                gap: 12,
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.iconColor,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                •
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={item.title}
                  onChange={(e) =>
                    onChange(item.id, 'title', e.target.value)
                  }
                  placeholder="Título"
                  style={inputTitleStyle}
                />

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    onChange(item.id, 'description', e.target.value)
                  }
                  placeholder="Descripción"
                  style={textareaStyle}
                />
              </div>

              <button
                onClick={() => onRemove(item.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputTitleStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  padding: '0 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 72,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  padding: '10px 12px',
  fontSize: 14,
  color: '#6b7280',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
  fontFamily: 'inherit',
}
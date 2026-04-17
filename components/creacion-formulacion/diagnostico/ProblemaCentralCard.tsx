type Props = {
    value: string
    onChange: (value: string) => void
  }
  
  export default function ProblemaCentralCard({ value, onChange }: Props) {
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
            marginBottom: 14,
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
            Problema Central
          </h3>
  
          <div style={{ color: '#2563eb', fontSize: 18 }}>✎</div>
        </div>
  
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 200,
            borderRadius: 16,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            padding: 20,
            fontSize: 15,
            color: '#374151',
            lineHeight: 1.7,
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>
    )
  }
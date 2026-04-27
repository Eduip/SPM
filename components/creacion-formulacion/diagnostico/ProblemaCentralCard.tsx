type Props = {
    value: string
    onChange: (value: string) => void
  }
  
  export default function ProblemaCentralCard({ value, onChange }: Props) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 18,
          border: '1px solid var(--border)',
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
              color: 'var(--text-strong)',
            }}
          >
            Problema Central
          </h3>
  
          <div style={{ color: 'var(--primary)', fontSize: 18 }}>✎</div>
        </div>
  
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 200,
            borderRadius: 16,
            background: '#f9fafb',
            border: '1px solid var(--border)',
            padding: 20,
            fontSize: 15,
            color: 'var(--text)',
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
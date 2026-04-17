type Props = {
    value: string
    onChange: (value: string) => void
  }
  
  export default function JustificacionCard({ value, onChange }: Props) {
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
            Justificación del Proyecto
          </h3>
  
          <div style={{ color: '#2563eb', fontSize: 18 }}>✎</div>
        </div>
  
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 220,
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
            marginBottom: 18,
          }}
        />
  
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 12,
            }}
          >
            Documentos de Respaldo
          </div>
  
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DocItem
              title="Informe Técnico Preliminar.pdf"
              subtitle="2.4 MB • Subido hace 2 días"
              bg="#eff6ff"
              color="#2563eb"
            />
            <DocItem
              title="Estudio Demanda Vial Sector Norte.pdf"
              subtitle="1.8 MB • Subido hace 5 días"
              bg="#ecfdf5"
              color="#16a34a"
            />
  
            <button
              style={{
                height: 52,
                borderRadius: 16,
                border: '1px dashed #cbd5e1',
                background: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              📄&nbsp;&nbsp;Adjuntar documento de respaldo
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  function DocItem({
    title,
    subtitle,
    bg,
    color,
  }: {
    title: string
    subtitle: string
    bg: string
    color: string
  }) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: '14px 16px',
          background: bg,
          border: `1px solid ${bg}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#ffffff',
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          📄
        </div>
  
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#111827',
              marginBottom: 2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    )
  }
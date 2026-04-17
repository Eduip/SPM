import { cardStyle } from '../shared'

export default function ComentariosAprobacionCard() {
  const comments = [
    {
      initials: 'MG',
      name: 'María González',
      date: '15/03/2026 - 14:30',
      text: 'Revisé la documentación técnica y está completa. Se sugiere priorizar este proyecto por su alto impacto social.',
    },
    {
      initials: 'JP',
      name: 'Juan Pérez',
      date: '16/03/2026 - 10:15',
      text: 'El presupuesto está validado y los montos coinciden con las partidas del PMU 2024.',
    },
  ]

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Comentarios
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {comments.map((comment) => (
          <div
            key={comment.name + comment.date}
            style={{
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              padding: 16,
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: '#dbeafe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {comment.initials}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {comment.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{comment.date}</div>
                </div>

                <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6 }}>
                  {comment.text}
                </div>
              </div>
            </div>
          </div>
        ))}

        <textarea
          placeholder="Añadir comentario..."
          style={{
            width: '100%',
            minHeight: 90,
            borderRadius: 14,
            border: '1px solid #d1d5db',
            padding: 14,
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        <button
          style={{
            width: 170,
            height: 42,
            borderRadius: 12,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Añadir comentario
        </button>
      </div>
    </div>
  )
}
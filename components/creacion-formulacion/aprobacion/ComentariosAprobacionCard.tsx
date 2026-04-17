'use client'

import { useState } from 'react'
import { cardStyle } from '../shared'

export default function ComentariosAprobacionCard() {
  const [draft, setDraft] = useState('')
  const [savedComments, setSavedComments] = useState<
    Array<{ initials: string; name: string; date: string; text: string }>
  >([])
  const [message, setMessage] = useState('')

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

  const allComments = [...comments, ...savedComments]

  const handleSave = () => {
    const text = draft.trim()

    if (!text) {
      setMessage('Escribe un comentario antes de guardar.')
      return
    }

    setSavedComments((prev) => [
      ...prev,
      {
        initials: 'US',
        name: 'Usuario',
        date: new Date().toLocaleString('es-CL'),
        text,
      },
    ])
    setDraft('')
    setMessage('Comentario agregado en esta revisión.')
  }

  const handleCancel = () => {
    setDraft('')
    setMessage('')
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Comentarios
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {allComments.map((comment) => (
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
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setMessage('')
          }}
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

        {message && (
          <div
            style={{
              borderRadius: 12,
              padding: '10px 12px',
              background: message.includes('agregado') ? '#ecfdf5' : '#fef2f2',
              border: message.includes('agregado') ? '1px solid #bbf7d0' : '1px solid #fecaca',
              color: message.includes('agregado') ? '#166534' : '#b91c1c',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleSave} style={primaryButtonStyle}>
            Guardar
          </button>
          <button type="button" onClick={handleCancel} style={secondaryButtonStyle}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  width: 120,
  height: 42,
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  width: 120,
  height: 42,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
}

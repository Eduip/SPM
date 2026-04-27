'use client'

import { useEffect, useState } from 'react'
import { Type } from 'lucide-react'

const fonts = [
  { value: 'original', label: 'Inter' },
  { value: 'geist', label: 'Geist' },
  { value: 'source-sans', label: 'Source Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'system', label: 'Sistema' },
]

export default function FontFamilySelector() {
  const [font, setFont] = useState(() => {
    if (typeof window === 'undefined') return 'original'

    return window.localStorage.getItem('app-font') || 'original'
  })

  useEffect(() => {
    applyFont(font)
  }, [font])

  const handleChange = (value: string) => {
    setFont(value)
    window.localStorage.setItem('app-font', value)
  }

  return (
    <label
      style={{
        height: 36,
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.12)',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 10px',
      }}
    >
      <Type size={16} />
      <select
        value={font}
        onChange={(event) => handleChange(event.target.value)}
        aria-label="Seleccionar tipografía"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {fonts.map((item) => (
          <option key={item.value} value={item.value} style={{ color: 'var(--text-strong)' }}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function applyFont(font: string) {
  if (font === 'original') {
    document.documentElement.removeAttribute('data-font')
    return
  }

  document.documentElement.setAttribute('data-font', font)
}

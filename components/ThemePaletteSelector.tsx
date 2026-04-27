'use client'

import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const themes = [
  { value: 'original', label: 'Original' },
  { value: 'bosque', label: 'Bosque' },
  { value: 'austral', label: 'Austral' },
  { value: 'grafito', label: 'Grafito' },
  { value: 'azul-niebla', label: 'Azul Niebla' },
  { value: 'pizarra', label: 'Pizarra' },
  { value: 'ciruela', label: 'Ciruela' },
]

export default function ThemePaletteSelector() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'original'

    return window.localStorage.getItem('app-theme') || 'original'
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const handleChange = (value: string) => {
    setTheme(value)
    window.localStorage.setItem('app-theme', value)
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
      <Palette size={16} />
      <select
        value={theme}
        onChange={(event) => handleChange(event.target.value)}
        aria-label="Seleccionar paleta de colores"
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
        {themes.map((item) => (
          <option key={item.value} value={item.value} style={{ color: 'var(--text-strong)' }}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function applyTheme(theme: string) {
  if (theme === 'original') {
    document.documentElement.removeAttribute('data-theme')
    return
  }

  document.documentElement.setAttribute('data-theme', theme)
}

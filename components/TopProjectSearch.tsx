'use client'

import { Search } from 'lucide-react'

export default function TopProjectSearch() {
  return (
    <form
      action="/cartera-proyectos"
      method="get"
      style={{
        width: '100%',
        maxWidth: 520,
      }}
    >
      <label
        style={{
          width: '100%',
          height: 40,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          color: 'rgba(255,255,255,0.82)',
          boxSizing: 'border-box',
        }}
      >
        <Search size={18} />
        <input
          type="search"
          name="search"
          placeholder="Buscar proyecto..."
          style={{
            flex: 1,
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'white',
            fontSize: 15,
          }}
        />
      </label>
    </form>
  )
}

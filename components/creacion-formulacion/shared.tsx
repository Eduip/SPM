export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text)',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 18,
  padding: 22,
  border: '1px solid var(--border)',
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 62,
  borderRadius: 18,
  border: '1.5px solid var(--border-strong)',
  background: 'var(--surface)',
  padding: '0 18px',
  fontSize: 16,
  color: 'var(--text-strong)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
}

export const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 62,
  borderRadius: 18,
  border: '1.5px solid var(--border-strong)',
  background: 'var(--surface)',
  padding: '0 18px',
  fontSize: 16,
  color: 'var(--text-strong)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  appearance: 'none',
}

export const twoColStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}
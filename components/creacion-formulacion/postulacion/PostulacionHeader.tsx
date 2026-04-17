type Props = {
  onSave: () => void
  saving: boolean
}

export default function PostulacionHeader({ onSave, saving }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 800,
          color: '#111827',
        }}
      >
        Registro y Formulación de Proyectos
      </h1>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{
            height: 44,
            padding: '0 20px',
            borderRadius: 14,
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#374151',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ✕&nbsp;&nbsp;Cancelar
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          style={{
            height: 44,
            padding: '0 20px',
            borderRadius: 14,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
            boxShadow: '0 10px 18px rgba(37, 99, 235, 0.18)',
          }}
        >
          💾&nbsp;&nbsp;{saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
export default function FormulationHeader() {
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
            color: 'var(--text-strong)',
          }}
        >
          Creación y Formulación de Proyectos
        </h1>
  
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 14,
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ✕&nbsp;&nbsp;Cancelar
          </button>
  
          <button
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 14,
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-contrast)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 18px var(--focus-ring)',
            }}
          >
            💾&nbsp;&nbsp;Guardar
          </button>
        </div>
      </div>
    )
  }
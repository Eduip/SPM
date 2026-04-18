import StageBackButton from '../StageBackButton'

export default function DocumentosHeader({ proyectoId }: { proyectoId: string }) {
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
          <StageBackButton
            href={`/creacion-formulacion/postulacion?proyectoId=${proyectoId}`}
          />

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
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 14,
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 18px rgba(37, 99, 235, 0.18)',
            }}
          >
            💾&nbsp;&nbsp;Guardar
          </button>
        </div>
      </div>
    )
  }

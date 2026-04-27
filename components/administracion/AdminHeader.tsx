export default function AdminHeader() {
    return (
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#374151',
            marginBottom: 16,
          }}
        >
          Módulo de Administración del Sistema
        </div>
  
        <h1
          style={{
            margin: 0,
            fontSize: 54,
            fontWeight: 800,
            color: 'var(--text-strong)',
            lineHeight: 1.1,
          }}
        >
          Administración del Sistema
        </h1>
  
        <div
          style={{
            marginTop: 12,
            fontSize: 18,
            color: '#6b7280',
            fontWeight: 500,
          }}
        >
          Configuración y gestión centralizada del sistema
        </div>
      </div>
    )
  }
export default function AprobacionStepper() {
    const steps = [
      { number: 1, title: 'Datos del\nProyecto', status: 'Completo', completed: true, active: false },
      { number: 2, title: 'Diagnóstico', status: 'Completo', completed: true, active: false },
      { number: 3, title: 'Postulación', status: 'Completo', completed: true, active: false },
      { number: 4, title: 'Documentos', status: 'Completo', completed: true, active: false },
      { number: 5, title: 'Aprobación', status: 'En revisión', completed: false, active: true },
    ]
  
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '26px 24px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        {steps.map((step, index, array) => (
          <div
            key={step.number}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 'fit-content',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: step.completed
                    ? '#22c55e'
                    : step.active
                    ? '#2563eb'
                    : '#e5e7eb',
                  color: step.completed || step.active ? '#ffffff' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {step.completed ? '✓' : step.number}
              </div>
  
              <div style={{ lineHeight: 1.15 }}>
                <div
                  style={{
                    fontWeight: step.active || step.completed ? 700 : 600,
                    color: step.completed ? '#16a34a' : step.active ? '#2563eb' : '#6b7280',
                    fontSize: 15,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {step.status}
                </div>
              </div>
            </div>
  
            {index < array.length - 1 && (
              <div
                style={{
                  height: 4,
                  flex: 1,
                  background: step.completed ? '#86efac' : '#e5e7eb',
                  borderRadius: 999,
                  margin: '0 14px',
                }}
              />
            )}
          </div>
        ))}
      </div>
    )
  }
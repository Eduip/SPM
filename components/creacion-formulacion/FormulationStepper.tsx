type FormulationStepperProps = {
  proyectoGuardado?: boolean
}

export default function FormulationStepper({
  proyectoGuardado = false,
}: FormulationStepperProps) {
  const steps = [
    {
      number: 1,
      title: 'Datos del\nProyecto',
      status: proyectoGuardado ? 'Completado' : 'En progreso',
      active: !proyectoGuardado,
      completed: proyectoGuardado,
    },
    {
      number: 2,
      title: 'Postulación',
      status: proyectoGuardado ? 'Disponible' : 'Pendiente',
      active: false,
      completed: false,
    },
    {
      number: 3,
      title: 'Documentos',
      status: 'Pendiente',
      active: false,
      completed: false,
    },
    {
      number: 4,
      title: 'Aprobación',
      status: 'Pendiente',
      active: false,
      completed: false,
    },
  ]

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        padding: '26px 24px',
        border: '1px solid var(--border)',
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
                  ? 'var(--success)'
                  : step.active
                  ? 'var(--primary)'
                  : 'var(--border)',
                color:
                  step.completed || step.active ? 'var(--surface)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {step.number}
            </div>

            <div style={{ lineHeight: 1.15 }}>
              <div
                style={{
                  fontWeight: step.active || step.completed ? 700 : 600,
                  color:
                    step.completed
                      ? 'var(--success)'
                      : step.active
                      ? 'var(--primary)'
                      : 'var(--text-muted)',
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
                  color: 'var(--text-muted)',
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
                background: step.completed ? 'var(--success-soft)' : 'var(--border)',
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

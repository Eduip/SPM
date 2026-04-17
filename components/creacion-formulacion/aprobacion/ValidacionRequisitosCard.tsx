import { cardStyle } from '../shared'

export default function ValidacionRequisitosCard({
  documentosOk,
  evaluacionOk,
  certificacionOk,
  presupuestoOk,
}: {
  documentosOk: boolean
  evaluacionOk: boolean
  certificacionOk: boolean
  presupuestoOk: boolean
}) {
  const items = [
    { label: 'Documentación obligatoria', ok: documentosOk, detail: 'Verificación antes de aprobar' },
    { label: 'Evaluación técnica', ok: evaluacionOk, detail: 'Puntaje mínimo alcanzado' },
    { label: 'Certificación administrativa', ok: certificacionOk, detail: 'Firmado por autoridad competente' },
    { label: 'Presupuesto validado', ok: presupuestoOk, detail: 'Monto y datos revisados' },
  ]

  const allOk = items.every((item) => item.ok)

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Validación de Requisitos
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 14,
              padding: 16,
              background: item.ok ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${item.ok ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: item.ok ? '#166534' : '#b91c1c',
                marginBottom: 4,
              }}
            >
              {item.ok ? '✓' : '✕'} {item.label}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{item.detail}</div>
          </div>
        ))}

        <div
          style={{
            marginTop: 8,
            borderRadius: 16,
            padding: 16,
            background: allOk ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${allOk ? '#86efac' : '#fecaca'}`,
            color: allOk ? '#166534' : '#b91c1c',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {allOk
            ? '✓ Todos los requisitos cumplidos'
            : '✕ Aún faltan requisitos para aprobar'}
        </div>
      </div>
    </div>
  )
}
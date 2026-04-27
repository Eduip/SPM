import type { ProyectoCartera } from '../../app/cartera-proyectos/page'

export default function CarteraStats({
  proyectos,
}: {
  proyectos: ProyectoCartera[]
}) {
  const total = proyectos.length
  const formulacion = proyectos.filter((p) => (p.porcentaje_formulacion ?? 0) < 100).length
  const ejecucion = proyectos.filter((p) => (p.avance_fisico_actual ?? 0) > 0).length
  const aprobados = proyectos.filter((p) => p.estado === 'aprobado').length
  const monto = proyectos.reduce((acc, p) => acc + getProjectBudget(p), 0)

  const cards = [
    { label: 'Total Proyectos', value: total, color: 'var(--primary)' },
    { label: 'En Formulación', value: formulacion, color: '#ea580c' },
    { label: 'En Ejecución', value: ejecucion, color: 'var(--success)' },
    { label: 'Aprobados', value: aprobados, color: 'var(--success)' },
    { label: 'Monto Total', value: `CLP ${formatCurrency(monto)}`, color: 'var(--primary)' },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid #e5e7eb',
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 10 }}>
            {card.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: card.color,
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL').format(value)
}

function getProjectBudget(proyecto: ProyectoCartera) {
  return Number(proyecto.presupuesto_total ?? proyecto.monto_estimado ?? 0)
}

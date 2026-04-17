import { cardStyle } from '../shared'
import type {
  PostulacionProyecto,
  ProyectoAprobacion,
} from '../../../lib/formulacion-types'

export default function ResumenProyectoCard({
  proyecto,
  postulacion,
}: {
  proyecto: ProyectoAprobacion | null
  postulacion: PostulacionProyecto | null
}) {
  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Resumen del Proyecto
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        <InfoBox label="Responsable" value={proyecto?.unidad?.nombre ?? '-'} />
        <InfoBox label="Fuente(s)" value={proyecto?.fuente?.nombre ?? '-'} />
        <InfoBox label="Código del Proyecto" value={proyecto?.codigo_interno ?? '-'} />
        <InfoBox label="Duración" value={postulacion?.periodo ?? '-'} />
        <InfoBox label="Periodo" value={String(proyecto?.anio_inicio ?? '-')} />
        <InfoBox label="Municipio" value="Curacautín" />
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 16,
          padding: 18,
          background: '#fff7ed',
          border: '1px solid #fed7aa',
        }}
      >
        <div style={{ fontSize: 13, color: '#9a3412', marginBottom: 8 }}>
          Monto Total del Proyecto
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#c2410c',
          }}
        >
          CLP ${formatCurrency(postulacion?.monto_total ?? proyecto?.monto_estimado ?? 0)}
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: '#f9fafb',
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('es-CL').format(Number(value) || 0)
}

import type { ProyectoFicha } from '../../../lib/project-types'

export default function ProveedoresTab({
  proyecto,
}: {
  proyecto: ProyectoFicha | null
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 28,
        border: '1px solid #e5e7eb',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 12,
          fontSize: 26,
          fontWeight: 800,
          color: '#111827',
        }}
      >
        Proveedores
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: 15,
          color: '#6b7280',
          lineHeight: 1.6,
        }}
      >
        Esta pestaña está lista para registrar y consultar proveedores asociados
        al proyecto{proyecto?.codigo_interno ? ` ${proyecto.codigo_interno}` : ''}.
      </p>
    </div>
  )
}

import { cardStyle, Field, selectStyle } from '../shared'
import type { FuenteCatalogo } from '../../../lib/formulacion-types'

type Props = {
  fuentes: FuenteCatalogo[]
  selectedFuenteId: string
  onChange: (value: string) => void
}

export default function FuenteFinanciamientoSelector({
  fuentes,
  selectedFuenteId,
  onChange,
}: Props) {
  const selectedFuente = fuentes.find((fuente) => fuente.id === selectedFuenteId)

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0, marginBottom: 18, fontSize: 20, fontWeight: 700 }}>
        Fuente de Financiamiento
      </h3>

      <Field label="Fuente de Financiamiento *">
        <select
          value={selectedFuenteId}
          onChange={(event) => onChange(event.target.value)}
          style={selectStyle}
        >
          <option value="">Selecciona una fuente</option>
          {fuentes.map((fuente) => (
            <option key={fuente.id} value={fuente.id}>
              {fuente.nombre}
            </option>
          ))}
        </select>
      </Field>

      {selectedFuente ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            border: '1px solid var(--primary-soft)',
            background: 'var(--primary-tint)',
            color: 'var(--primary-dark)',
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Formulario activo: {selectedFuente.nombre}
        </div>
      ) : null}
    </div>
  )
}

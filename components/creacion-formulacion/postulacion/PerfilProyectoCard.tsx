import { Field, inputStyle, twoColStyle } from '../shared'

type Props = {
  tipoProyecto: string
  setTipoProyecto: (value: string) => void
  nombreProyecto: string
  setNombreProyecto: (value: string) => void
  montoTotal: string
  setMontoTotal: (value: string) => void
  unidadResponsable: string
  setUnidadResponsable: (value: string) => void
  utmX: string
  setUtmX: (value: string) => void
  utmY: string
  setUtmY: (value: string) => void
  periodo: string
  setPeriodo: (value: string) => void
  fuentes: string[]
  setFuentes: React.Dispatch<React.SetStateAction<string[]>>
  onCalculateScore: () => void
}

export default function PerfilProyectoCard({
  tipoProyecto,
  setTipoProyecto,
  nombreProyecto,
  setNombreProyecto,
  montoTotal,
  setMontoTotal,
  unidadResponsable,
  setUnidadResponsable,
  utmX,
  setUtmX,
  utmY,
  setUtmY,
  periodo,
  setPeriodo,
  fuentes,
  setFuentes,
  onCalculateScore,
}: Props) {
  const toggleFuente = (fuente: string) => {
    setFuentes((prev) =>
      prev.includes(fuente)
        ? prev.filter((f) => f !== fuente)
        : [...prev, fuente]
    )
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        padding: 22,
        border: '1px solid #e5e7eb',
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 18,
          fontSize: 20,
          fontWeight: 700,
          color: '#111827',
        }}
      >
        Perfil del Proyecto
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Tipo de Proyecto *">
          <input
            value={tipoProyecto}
            onChange={(e) => setTipoProyecto(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Fuente(s) de Financiamiento *">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {['FNDR', 'PMU', 'SUBDERE', 'Municipal'].map((fuente) => {
              const active = fuentes.includes(fuente)
              return (
                <button
                  key={fuente}
                  type="button"
                  onClick={() => toggleFuente(fuente)}
                  style={{
                    height: 30,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: active ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                    background: active ? '#dbeafe' : '#ffffff',
                    color: active ? '#2563eb' : '#374151',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {fuente}
                </button>
              )
            })}
          </div>
          <input style={inputStyle} readOnly value={fuentes.join(', ')} />
        </Field>

        <Field label="Problema Priorizado (Referencia al Diagnóstico)">
          <input
            value="Deterioro significativo de pavimentación en sector norte de Curacautín"
            readOnly
            style={{
              ...inputStyle,
              background: '#f3f4f6',
              color: '#6b7280',
            }}
          />
        </Field>

        <Field label="Nombre del Proyecto *">
          <input
            value={nombreProyecto}
            onChange={(e) => setNombreProyecto(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Monto Total del Proyecto *">
          <input
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            style={inputStyle}
          />
          <div style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
            Ingresa el monto total en pesos chilenos.
          </div>
        </Field>

        <Field label="Unidad Responsable *">
          <input
            value={unidadResponsable}
            onChange={(e) => setUnidadResponsable(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Coordenadas UTM (Zona 19S)">
          <div style={twoColStyle}>
            <input
              placeholder="258.345"
              value={utmX}
              onChange={(e) => setUtmX(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="5.789.234"
              value={utmY}
              onChange={(e) => setUtmY(e.target.value)}
              style={inputStyle}
            />
          </div>
        </Field>

        <Field label="Periodo del Proyecto *">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px',
              gap: 12,
            }}
          >
            <input
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={inputStyle}
            />
<button
  type="button"
  onClick={onCalculateScore}
  style={{
    height: 62,
    borderRadius: 16,
    border: 'none',
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  }}
>
  Calcular Puntaje
</button>
          </div>
        </Field>
      </div>
    </div>
  )
}
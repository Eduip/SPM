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
}: Props) {
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
          <input
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>
    </div>
  )
}

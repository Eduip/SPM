type Props = {
    estado: string
    setEstado: (v: string) => void
    unidad: string
    setUnidad: (v: string) => void
    fuente: string
    setFuente: (v: string) => void
    anio: string
    setAnio: (v: string) => void
    unidades: string[]
    fuentes: string[]
    anios: number[]
  }
  
  export default function CarteraFilters(props: Props) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <FilterSelect
          value={props.estado}
          onChange={props.setEstado}
          options={['Todos', 'En Formulación', 'En Ejecución', 'Aprobado', 'Pendiente']}
        />
        <FilterSelect
          value={props.unidad}
          onChange={props.setUnidad}
          options={['Todas', ...props.unidades]}
        />
        <FilterSelect
          value={props.fuente}
          onChange={props.setFuente}
          options={['Todas', ...props.fuentes]}
        />
        <FilterSelect
          value={props.anio}
          onChange={props.setAnio}
          options={['Todos', ...props.anios.map(String)]}
        />
      </div>
    )
  }
  
  function FilterSelect({
    value,
    onChange,
    options,
  }: {
    value: string
    onChange: (v: string) => void
    options: string[]
  }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 44,
          borderRadius: 14,
          border: '1px solid #d1d5db',
          padding: '0 14px',
          background: '#fff',
          fontSize: 14,
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
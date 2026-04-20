import type { ProyectoFicha } from '../../lib/project-types'

export default function ProyectoHeader({
    proyecto,
    tab,
  }: {
    proyecto: ProyectoFicha
    tab: string
  }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontSize: 14,
            color: '#6b7280',
            fontWeight: 500,
          }}
        >
          Cartera de Proyectos &gt; {proyecto?.codigo_interno ?? '-'} &gt; {getTabTitle(tab)}
        </div>
  
        <h1
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 800,
            color: '#111827',
          }}
        >
          Ficha del Proyecto
        </h1>
  
        <div
  style={{
    background: '#ffffff',
    borderRadius: 20,
    padding: 28,
    border: '1px solid #e5e7eb',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 24,
    alignItems: 'center',
  }}
>
<div style={{ display: 'flex', gap: 16 }}>
  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: 16,
      background: '#e0ecff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      flexShrink: 0,
    }}
  >
    🏗️
  </div>

  <div style={{ flex: 1 }}>
    <div
      style={{
        fontSize: 36,
        fontWeight: 800,
        color: '#111827',
        marginBottom: 10,
      }}
    >
      {proyecto?.nombre ?? 'Proyecto'}
    </div>

    <div
      style={{
        fontSize: 18,
        color: '#2563eb',
        fontWeight: 700,
        marginBottom: 20,
      }}
    >
      Código: {proyecto?.codigo_interno ?? '-'}
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}
    >
      <InfoItem
        label="Código financiamiento"
        value={proyecto?.fuente?.nombre ?? '-'}
      />
      <InfoItem
        label="Financiador"
        value={proyecto?.responsable?.nombre_completo ?? '-'}
      />
      <InfoItem
        label="Fecha"
        value={proyecto?.created_at ? formatDate(proyecto.created_at) : '-'}
      />
      <InfoItem
        label="Función"
        value="Código institucional"
      />
      <InfoItem
        label="Término contractual"
        value="15 Dic 2024"
      />
    </div>
  </div>
</div>
  
<ProgressCircle
  value={Number(proyecto?.avance_fisico_actual ?? 0)}
  label="Avance Físico"
  color="#22c55e"
/>

<ProgressCircle
  value={Number(proyecto?.avance_financiero_actual ?? 0)}
  label="Avance Financiero"
  color="#f59e0b"
/>
        </div>
      </div>
    )
  }
  
  function InfoItem({
    label,
    value,
  }: {
    label: string
    value: string
  }) {
    return (
      <div>
        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {value}
        </div>
      </div>
    )
  }
  
  function ProgressCircle({
    value,
    label,
    color,
  }: {
    value: number
    label: string
    color: string
  }) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `conic-gradient(${color} ${value}%, #e5e7eb ${value}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            {value}%
          </div>
        </div>
  
        <div
          style={{
            marginTop: 10,
            fontSize: 18,
            fontWeight: 700,
            color: '#374151',
          }}
        >
          {label}
        </div>
      </div>
    )
  }
  
  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function getTabTitle(tab: string) {
    if (tab === 'ejecucion') return 'Ejecución'
    if (tab === 'proveedores') return 'Proveedores'
    if (tab === 'financiamiento') return 'Financiamiento'
    if (tab === 'rendicion') return 'Rendición'
    if (tab === 'garantias') return 'Garantías'
    if (tab === 'bitacora') return 'Bitácora'
    if (tab === 'historial') return 'Historial'
    return 'General'
  }

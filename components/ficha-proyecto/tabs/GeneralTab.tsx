import type { ProyectoFicha } from '../../../lib/project-types'

export default function GeneralTab({ proyecto }: { proyecto: ProyectoFicha | null }) {
    if (!proyecto) {
      return (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: 20,
            border: '1px solid #fecaca',
            color: '#b91c1c',
          }}
        >
          No se pudo cargar la información del proyecto.
        </div>
      )
    }
  
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 20,
              fontSize: 22,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Información General
          </h3>
  
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
            }}
          >
            <Info label="Nombre" value={proyecto.nombre} />
            <Info label="Código interno" value={proyecto.codigo_interno} />
            <Info label="Unidad" value={proyecto.unidad?.nombre} />
            <Info label="Fuente" value={proyecto.fuente?.nombre} />
            <Info
              label="Responsable"
              value={proyecto.responsable?.nombre_completo}
            />
            <Info
              label="Presupuesto"
              value={`CLP ${formatCurrency(Number(proyecto.monto_estimado ?? 0))}`}
            />
            <Info
              label="Año de inicio"
              value={String(proyecto.anio_inicio ?? '-')}
            />
            <Info
              label="Estado"
              value={proyecto.estado ?? 'en_formulación'}
            />
          </div>
  
          <div
            style={{
              marginTop: 24,
              borderRadius: 16,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 10,
              }}
            >
              Descripción del Proyecto
            </div>
  
            <div
              style={{
                fontSize: 14,
                color: '#4b5563',
                lineHeight: 1.7,
              }}
            >
              Proyecto orientado al mejoramiento de infraestructura y fortalecimiento
              de la gestión pública local. Esta sección puede luego conectarse con la
              descripción real guardada en el módulo de creación y formulación.
            </div>
          </div>
        </div>
  
        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SideCard title="Últimos Documentos">
            <MiniItem
              title="Informe Técnico.pdf"
              subtitle="Subido recientemente"
            />
            <MiniItem
              title="Presupuesto.xlsx"
              subtitle="Pendiente revisión"
            />
          </SideCard>
  
          <SideCard title="Alertas">
            <AlertItem
              text="Proyecto en revisión documental"
              color="#2563eb"
            />
            <AlertItem
              text="Falta validar información financiera"
              color="#ea580c"
            />
          </SideCard>
        </div>
      </div>
    )
  }
  
  function Info({
    label,
    value,
  }: {
    label: string
    value?: string | null
  }) {
    return (
      <div>
        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 6,
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
          {value ?? '-'}
        </div>
      </div>
    )
  }
  
  function SideCard({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) {
    return (
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: 20,
          border: '1px solid #e5e7eb',
        }}
      >
        <h4
          style={{
            marginTop: 0,
            marginBottom: 16,
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {title}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      </div>
    )
  }
  
  function MiniItem({
    title,
    subtitle,
  }: {
    title: string
    subtitle: string
  }) {
    return (
      <div
        style={{
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          padding: '14px 16px',
          background: '#f9fafb',
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {subtitle}
        </div>
      </div>
    )
  }
  
  function AlertItem({
    text,
    color,
  }: {
    text: string
    color: string
  }) {
    return (
      <div
        style={{
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          padding: '14px 16px',
          background: '#ffffff',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            marginTop: 5,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    )
  }
  
  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CL').format(value)
  }

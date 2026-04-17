import {
    CheckCircle2,
    Clock3,
    FileBadge2,
    PlayCircle,
  } from 'lucide-react'
  import { cardStyle } from './shared'
  
  const recentProjects = [
    {
      title: 'Construcción Gimnasio Municipal',
      status: 'En Ejecución',
      color: '#dbeafe',
      textColor: '#2563eb',
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
      time: 'Hace 2 días',
      icon: PlayCircle,
    },
    {
      title: 'Mejoramiento Plaza de Armas',
      status: 'Finalizado',
      color: '#dcfce7',
      textColor: '#16a34a',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      time: 'Hace 5 días',
      icon: CheckCircle2,
    },
    {
      title: 'Adquisición Equipos Deportivos',
      status: 'En Revisión',
      color: '#ffedd5',
      textColor: '#ea580c',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      time: 'Hace 1 semana',
      icon: Clock3,
    },
    {
      title: "Pavimentación Calle O'Higgins",
      status: 'En Formulación',
      color: '#f3e8ff',
      textColor: '#9333ea',
      iconBg: '#f3e8ff',
      iconColor: '#9333ea',
      time: 'Hace 2 semanas',
      icon: FileBadge2,
    },
  ]
  
  export default function RecentProjectsPanel() {
    return (
      <div style={cardStyle}>
        <h3
          style={{
            margin: 0,
            marginBottom: 20,
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Últimos Proyectos
        </h3>
  
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {recentProjects.map((item) => {
            const Icon = item.icon
  
            return (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr auto',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: item.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={item.iconColor} />
                </div>
  
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#111827',
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>
  
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 28,
                      padding: '0 12px',
                      borderRadius: 999,
                      background: item.color,
                      color: item.textColor,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
  
                <div
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.time}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
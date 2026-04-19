import {
  Building2,
  FileText,
  ShoppingCart,
  Users,
} from 'lucide-react'
import type { CatalogOption } from './CreateProjectFormContainer'

type ProjectTypeCardsProps = {
  tiposProyecto: CatalogOption[]
  selectedTipoId: string
  onSelect: (tipoId: string) => void
  disabled?: boolean
}

function getIconByName(nombre: string) {
  const normalized = nombre.toLowerCase()

  if (normalized.includes('obra')) return Building2
  if (normalized.includes('adquis')) return ShoppingCart
  if (normalized.includes('program')) return Users
  if (normalized.includes('asistencia')) return FileText

  return FileText
}

export default function ProjectTypeCards({
  tiposProyecto,
  selectedTipoId,
  onSelect,
  disabled = false,
}: ProjectTypeCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      {tiposProyecto.map((tipo) => {
        const Icon = getIconByName(tipo.nombre)
        const active = selectedTipoId === tipo.id

        return (
          <button
            key={tipo.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(tipo.id)}
            style={{
              height: 150,
              borderRadius: 20,
              border: active ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: active ? '#eff6ff' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled && !active ? 0.65 : 1,
              transition: 'all 0.2s ease',
              padding: '0 8px',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: active ? '#2563eb' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={28} color={active ? '#ffffff' : '#6b7280'} />
            </div>

            <div
              style={{
                textAlign: 'center',
                fontWeight: active ? 700 : 600,
                color: '#374151',
                lineHeight: 1.3,
                fontSize: 15,
              }}
            >
              {tipo.nombre}
            </div>
          </button>
        )
      })}
    </div>
  )
}

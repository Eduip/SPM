import { Trash2, Plus } from 'lucide-react'
import { Field } from './shared'
import type { BeneficiaryGroup } from './CreateProjectFormContainer'

type Props = {
  descripcion: string
  beneficiarios: BeneficiaryGroup[]
  onDescripcionChange: (value: string) => void
  onBeneficiaryChange: (
    rowId: string,
    field: 'group' | 'quantity',
    value: string
  ) => void
  onAddBeneficiary: () => void
  onRemoveBeneficiary: (rowId: string) => void
}

export default function ProjectDescriptionAndBeneficiaries({
  descripcion,
  beneficiarios,
  onDescripcionChange,
  onBeneficiaryChange,
  onAddBeneficiary,
  onRemoveBeneficiary,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Field label="Descripción del Proyecto *">
        <textarea
          placeholder="Describe el proyecto, sus objetivos y alcance..."
          style={textareaStyle}
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
        />
      </Field>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: 14,
            fontSize: 15,
            fontWeight: 700,
            color: '#374151',
          }}
        >
          Población Beneficiaria
        </label>

        <div
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 18,
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 72px',
              gap: 16,
              padding: '22px 24px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div style={headerCellStyle}>Tipo de Grupo</div>
            <div style={headerCellStyle}>Número Aproximado</div>
            <div />
          </div>

          {beneficiarios.map((row, index) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 72px',
                gap: 16,
                padding: '20px 24px',
                borderBottom:
                  index < beneficiarios.length - 1
                    ? '1px solid #e5e7eb'
                    : 'none',
                alignItems: 'center',
              }}
            >
              <input
                value={row.group}
                onChange={(e) =>
                  onBeneficiaryChange(row.id, 'group', e.target.value)
                }
                style={tableInputStyle}
              />
              <input
                value={row.quantity}
                onChange={(e) =>
                  onBeneficiaryChange(row.id, 'quantity', e.target.value)
                }
                style={tableInputStyle}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  style={deleteButtonStyle}
                  aria-label="Eliminar grupo"
                  onClick={() => onRemoveBeneficiary(row.id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" style={addGroupButtonStyle} onClick={onAddBeneficiary}>
          <Plus size={20} />
          Añadir grupo
        </button>
      </div>
    </div>
  )
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 180,
  borderRadius: 20,
  border: '1.5px solid #d1d5db',
  background: '#ffffff',
  padding: '18px',
  fontSize: 16,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'none',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease',
}

const tableInputStyle: React.CSSProperties = {
  width: '100%',
  height: 58,
  borderRadius: 16,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  padding: '0 18px',
  fontSize: 16,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
}

const headerCellStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.08em',
  color: '#374151',
  textTransform: 'uppercase',
}

const deleteButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: 'none',
  background: 'transparent',
  color: '#ef4444',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const addGroupButtonStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
}
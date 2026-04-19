import ProjectTypeCards from './ProjectTypeCards'
import ProjectDescriptionAndBeneficiaries from './ProjectDescriptionAndBeneficiaries'
import { Field, inputStyle, twoColStyle, selectStyle } from './shared'
import type {
  CatalogOption,
  ProjectFormData,
  ResponsibleOption,
} from './CreateProjectFormContainer'

type ProjectDataFormProps = {
  tiposProyecto: CatalogOption[]
  categorias: CatalogOption[]
  unidades: CatalogOption[]
  responsables: ResponsibleOption[]
  formData: ProjectFormData
  selectedResponsible: ResponsibleOption | null
  onFieldChange: (
    field: keyof Omit<ProjectFormData, 'poblacion_beneficiaria'>,
    value: string
  ) => void
  onTypeSelect: (tipoId: string) => void
  onBeneficiaryChange: (
    rowId: string,
    field: 'group' | 'quantity',
    value: string
  ) => void
  onAddBeneficiary: () => void
  onRemoveBeneficiary: (rowId: string) => void
  readOnly?: boolean
}

export default function ProjectDataForm({
  tiposProyecto,
  categorias,
  unidades,
  responsables,
  formData,
  selectedResponsible,
  onFieldChange,
  onTypeSelect,
  onBeneficiaryChange,
  onAddBeneficiary,
  onRemoveBeneficiary,
  readOnly = false,
}: ProjectDataFormProps) {
  const disabledInputStyle = readOnly ? disabledFieldStyle : {}

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 28,
        border: '1px solid #e5e7eb',
        boxShadow: '0 8px 18px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        <Field label="Nombre del Proyecto *">
          <input
            placeholder="Ej: Construcción Gimnasio Municipal"
            style={{ ...inputStyle, ...disabledInputStyle }}
            value={formData.nombre}
            readOnly={readOnly}
            onChange={(e) => onFieldChange('nombre', e.target.value)}
          />
        </Field>

        <div style={twoColStyle}>
          <Field label="Código Interno *">
            <input
              value="Se generará automáticamente"
              readOnly
              style={{
                ...inputStyle,
                ...disabledInputStyle,
                background: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed',
              }}
            />
          </Field>

          <Field label="Código Adicional">
            <input
              placeholder="PRJ-2024-"
              style={{ ...inputStyle, ...disabledInputStyle }}
              value={formData.codigo_adicional}
              readOnly={readOnly}
              onChange={(e) =>
                onFieldChange('codigo_adicional', e.target.value)
              }
            />
          </Field>
        </div>

        <Field label="Tipo de Proyecto *">
          <ProjectTypeCards
            tiposProyecto={tiposProyecto}
            selectedTipoId={formData.tipo_proyecto_id}
            onSelect={onTypeSelect}
            disabled={readOnly}
          />
        </Field>

        <div style={twoColStyle}>
          <Field label="Categoría *">
            <select
              value={formData.categoria_id}
              disabled={readOnly}
              onChange={(e) => onFieldChange('categoria_id', e.target.value)}
              style={{ ...selectStyle, ...disabledInputStyle }}
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Año de Inicio *">
            <select
              value={formData.anio_inicio}
              disabled={readOnly}
              onChange={(e) => onFieldChange('anio_inicio', e.target.value)}
              style={{ ...selectStyle, ...disabledInputStyle }}
            >
              <option value="" disabled>
                Selecciona un año
              </option>
              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((anio) => (
                <option key={anio} value={String(anio)}>
                  {anio}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={twoColStyle}>
          <Field label="Unidad Responsable *">
            <select
              value={formData.unidad_id}
              disabled={readOnly}
              onChange={(e) => onFieldChange('unidad_id', e.target.value)}
              style={{ ...selectStyle, ...disabledInputStyle }}
            >
              <option value="" disabled>
                Selecciona una unidad
              </option>
              {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {unidad.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Localización">
            <input
              placeholder="Curacautín, Chile"
              style={{ ...inputStyle, ...disabledInputStyle }}
              value={formData.localizacion}
              readOnly={readOnly}
              onChange={(e) => onFieldChange('localizacion', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Responsable del Proyecto *">
          <div
            style={{
              height: 62,
              borderRadius: 18,
              border: '1.5px solid #d1d5db',
              background: '#ffffff',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: '#dbeafe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {getInitials(selectedResponsible?.nombre_completo ?? 'SR')}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  {selectedResponsible?.nombre_completo ?? 'Sin responsable'}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginTop: 2,
                  }}
                >
                  {selectedResponsible?.email ?? ''}
                </div>
              </div>
            </div>

            <select
              value={formData.responsable_id}
              disabled={readOnly}
              onChange={(e) => onFieldChange('responsable_id', e.target.value)}
              style={{
                ...selectStyle,
                ...disabledInputStyle,
                width: 170,
                height: 44,
                borderRadius: 12,
                fontSize: 14,
              }}
            >
              <option value="" disabled>
                Cambiar
              </option>
              {responsables.map((responsable) => (
                <option key={responsable.id} value={responsable.id}>
                  {responsable.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <ProjectDescriptionAndBeneficiaries
          descripcion={formData.descripcion}
          beneficiarios={formData.poblacion_beneficiaria}
          onDescripcionChange={(value) => onFieldChange('descripcion', value)}
          onBeneficiaryChange={onBeneficiaryChange}
          onAddBeneficiary={onAddBeneficiary}
          onRemoveBeneficiary={onRemoveBeneficiary}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

const disabledFieldStyle: React.CSSProperties = {
  background: '#f9fafb',
  color: '#6b7280',
  cursor: 'not-allowed',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  crearCampoFuente,
  crearFuenteFinanciamiento,
  crearReglaFuente,
  guardarConfiguracionFuente,
} from '../../../app/administracion/fuentes-financiamiento/actions'
import type {
  CampoPostulacion,
  DocumentoFuente,
  ReglaFuente,
} from '../../../lib/formulacion-types'

type Fuente = {
  id: string
  nombre: string
  activo: boolean | null
  codigo: string | null
  descripcion: string | null
  requiere_evaluacion_tecnica: boolean | null
  requiere_rendicion_obligatoria: boolean | null
  requiere_aprobacion_externa: boolean | null
  monto_minimo: number | null
  monto_maximo: number | null
  tipo_financiamiento: string | null
  plazo_maximo_meses: number | null
}

type FormState = {
  nombre: string
  codigo: string
  descripcion: string
  activo: boolean
  requiere_evaluacion_tecnica: boolean
  requiere_rendicion_obligatoria: boolean
  requiere_aprobacion_externa: boolean
  monto_minimo: string
  monto_maximo: string
  tipo_financiamiento: string
  plazo_maximo_meses: string
}

const emptyForm: FormState = {
  nombre: '',
  codigo: '',
  descripcion: '',
  activo: true,
  requiere_evaluacion_tecnica: false,
  requiere_rendicion_obligatoria: false,
  requiere_aprobacion_externa: false,
  monto_minimo: '',
  monto_maximo: '',
  tipo_financiamiento: 'Total',
  plazo_maximo_meses: '',
}

function toFormState(fuente: Fuente | null): FormState {
  if (!fuente) return emptyForm

  return {
    nombre: fuente.nombre ?? '',
    codigo: fuente.codigo ?? '',
    descripcion: fuente.descripcion ?? '',
    activo: Boolean(fuente.activo),
    requiere_evaluacion_tecnica: Boolean(fuente.requiere_evaluacion_tecnica),
    requiere_rendicion_obligatoria: Boolean(fuente.requiere_rendicion_obligatoria),
    requiere_aprobacion_externa: Boolean(fuente.requiere_aprobacion_externa),
    monto_minimo:
      fuente.monto_minimo !== null && fuente.monto_minimo !== undefined
        ? String(fuente.monto_minimo)
        : '',
    monto_maximo:
      fuente.monto_maximo !== null && fuente.monto_maximo !== undefined
        ? String(fuente.monto_maximo)
        : '',
    tipo_financiamiento: fuente.tipo_financiamiento ?? 'Total',
    plazo_maximo_meses:
      fuente.plazo_maximo_meses !== null && fuente.plazo_maximo_meses !== undefined
        ? String(fuente.plazo_maximo_meses)
        : '',
  }
}

export default function FuentesFinanciamientoPage({
    fuentes,
    documentos,
    campos,
    reglas,
    error,
  }: {
    fuentes: Fuente[]
    documentos: DocumentoFuente[]
    campos: CampoPostulacion[]
    reglas: ReglaFuente[]
    error: string | null
  }) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [showNewFieldForm, setShowNewFieldForm] = useState(false)
  const [showNewRuleForm, setShowNewRuleForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(fuentes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)

  const selectedFuente = useMemo(
    () => fuentes.find((f) => f.id === selectedId) ?? fuentes[0] ?? null,
    [fuentes, selectedId]
  )

  const docsFuente = documentos.filter((d) => d.fuente_id === selectedFuente?.id)
  
  const camposFuente = campos.filter((c) => c.fuente_id === selectedFuente?.id)
  
  const reglasFuente = reglas.filter((r) => r.fuente_id === selectedFuente?.id)

  const [form, setForm] = useState<FormState>(() => toFormState(selectedFuente))

  const handleSelect = (fuente: Fuente) => {
    setSelectedId(fuente.id)
    setForm(toFormState(fuente))
    setShowNewFieldForm(false)
    setShowNewRuleForm(false)
  }

  const handleExport = () => {
    const rows = fuentes.map((fuente) => ({
      nombre: fuente.nombre,
      codigo: fuente.codigo ?? '',
      activo: fuente.activo ? 'Activa' : 'Inactiva',
      tipo_financiamiento: fuente.tipo_financiamiento ?? '',
      monto_minimo: fuente.monto_minimo ?? '',
      monto_maximo: fuente.monto_maximo ?? '',
      plazo_maximo_meses: fuente.plazo_maximo_meses ?? '',
    }))

    const header = Object.keys(rows[0] ?? {
      nombre: '',
      codigo: '',
      activo: '',
      tipo_financiamiento: '',
      monto_minimo: '',
      monto_maximo: '',
      plazo_maximo_meses: '',
    })
    const csv = [
      header.join(','),
      ...rows.map((row) =>
        header
          .map((key) => `"${String(row[key as keyof typeof row]).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fuentes-financiamiento.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!selectedFuente) return

    setSaving(true)

    const res = await guardarConfiguracionFuente({
      id: selectedFuente.id,
      payload: {
        nombre: form.nombre,
        codigo: form.codigo,
        descripcion: form.descripcion,
        activo: form.activo,
        requiere_evaluacion_tecnica: form.requiere_evaluacion_tecnica,
        requiere_rendicion_obligatoria: form.requiere_rendicion_obligatoria,
        requiere_aprobacion_externa: form.requiere_aprobacion_externa,
        monto_minimo: Number(form.monto_minimo || 0),
        monto_maximo: Number(form.monto_maximo || 0),
        tipo_financiamiento: form.tipo_financiamiento,
        plazo_maximo_meses: Number(form.plazo_maximo_meses || 0),
      },
    })

    setSaving(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
              marginBottom: 10,
              fontWeight: 500,
            }}
          >
            Administración &gt; Fuentes de Financiamiento
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Fuentes de Financiamiento
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Administre las fuentes de financiamiento y configure sus requisitos de postulación
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleExport} style={secondaryButtonStyle}>
            Exportar
          </button>
          <button
            type="button"
            disabled
            title="Duplicar configuraciones todavía no está implementado."
            style={disabledButtonStyle}
          >
            Duplicar Configuración
          </button>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            style={darkButtonStyle}
          >
            + Nueva Fuente
          </button>
        </div>
      </div>

      {error && (
        <div style={errorCardStyle}>
          Error al cargar fuentes: {error}
        </div>
      )}

      {showNewForm && (
        <form
          action={async (formData) => {
            const res = await crearFuenteFinanciamiento(formData)
            if (!res.success) {
              alert(res.error)
              return
            }

            setShowNewForm(false)
            router.refresh()
          }}
          style={topNewFormStyle}
        >
          <input
            name="nombre"
            placeholder="Nombre de la nueva fuente"
            required
            style={inputStyle}
          />

          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activa
          </label>

          <button type="submit" style={saveButtonStyle}>
            Guardar fuente
          </button>
        </form>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* COLUMNA IZQUIERDA */}
        <div style={leftPanelStyle}>
          <div style={sectionTitleStyle}>💲 Fuentes Disponibles</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fuentes.map((fuente) => {
              const active = fuente.id === selectedFuente?.id

              return (
                <button
                  key={fuente.id}
                  onClick={() => handleSelect(fuente)}
                  style={{
                    ...leftCardStyle,
                    border: active ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: active ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#111827',
                      marginBottom: 4,
                      textAlign: 'left',
                    }}
                  >
                    {fuente.nombre}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 8,
                      textAlign: 'left',
                    }}
                  >
                    {fuente.codigo || 'Sin código'}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      lineHeight: 1.5,
                      textAlign: 'left',
                      marginBottom: 10,
                    }}
                  >
                    {fuente.descripcion || 'Sin descripción'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 22,
                        padding: '0 8px',
                        borderRadius: 999,
                        background: fuente.activo ? '#dcfce7' : '#fee2e2',
                        color: fuente.activo ? '#16a34a' : '#dc2626',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {fuente.activo ? 'Activa' : 'Inactiva'}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        fontWeight: 600,
                      }}
                    >
                      configuración
                    </span>
                  </div>
                </button>
              )
            })}

            <button
              onClick={() => setShowNewForm(true)}
              style={ghostAddButtonStyle}
            >
              + Crear Fuente
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Configuración principal */}
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>⚙️ Configuración de la Fuente</div>

            <div style={twoColsStyle}>
              <Field
                label="Nombre de la fuente"
                value={form.nombre}
                onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
              />
              <Field
                label="Código"
                value={form.codigo}
                onChange={(v) => setForm((s) => ({ ...s, codigo: v }))}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <TextAreaField
                label="Descripción"
                value={form.descripcion}
                onChange={(v) => setForm((s) => ({ ...s, descripcion: v }))}
                placeholder="Describe las características de esta fuente..."
              />
            </div>

            <div style={toggleGridStyle}>
              <ToggleItem
                title="Fuente activa"
                subtitle="Disponible para postulación"
                checked={form.activo}
                onChange={(v) => setForm((s) => ({ ...s, activo: v }))}
              />
              <ToggleItem
                title="Requiere evaluación técnica"
                subtitle="Evaluación obligatoria"
                checked={form.requiere_evaluacion_tecnica}
                onChange={(v) =>
                  setForm((s) => ({ ...s, requiere_evaluacion_tecnica: v }))
                }
              />
              <ToggleItem
                title="Requiere rendición obligatoria"
                subtitle="Control de rendición"
                checked={form.requiere_rendicion_obligatoria}
                onChange={(v) =>
                  setForm((s) => ({ ...s, requiere_rendicion_obligatoria: v }))
                }
              />
              <ToggleItem
                title="Requiere aprobación externa"
                subtitle="Aprobación ministerial"
                checked={form.requiere_aprobacion_externa}
                onChange={(v) =>
                  setForm((s) => ({ ...s, requiere_aprobacion_externa: v }))
                }
              />
            </div>
          </div>

          {/* Parámetros financieros */}
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>📄 Parámetros Financieros</div>

            <div style={twoColsStyle}>
              <Field
                label="Monto mínimo permitido"
                value={form.monto_minimo}
                onChange={(v) => setForm((s) => ({ ...s, monto_minimo: v }))}
                placeholder="$10.000.000"
              />
              <Field
                label="Monto máximo permitido"
                value={form.monto_maximo}
                onChange={(v) => setForm((s) => ({ ...s, monto_maximo: v }))}
                placeholder="$500.000.000"
              />
              <SelectField
                label="Tipo de financiamiento"
                value={form.tipo_financiamiento}
                onChange={(v) =>
                  setForm((s) => ({ ...s, tipo_financiamiento: v }))
                }
                options={['Total', 'Parcial', 'Mixto']}
              />
              <Field
                label="Plazo máximo (meses)"
                value={form.plazo_maximo_meses}
                onChange={(v) =>
                  setForm((s) => ({ ...s, plazo_maximo_meses: v }))
                }
                placeholder="24"
              />
            </div>
          </div>

          {/* Documentos requeridos */}
          <div style={panelCardStyle}>
            <div
              style={{
                ...panelHeaderStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>📄 Documentos Requeridos</span>
              <button
                type="button"
                disabled
                title="La gestión de documentos por fuente requiere una acción de catálogo pendiente."
                style={disabledMiniButtonStyle}
              >
                + Añadir documento
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
{docsFuente.length === 0 ? (
    <div style={{ fontSize: 13, color: '#6b7280' }}>
      No hay documentos configurados para esta fuente.
    </div>
  ) : (
    docsFuente.map((doc) => (
      <SimpleRow
        key={doc.id}
        left={doc.nombre}
        right={doc.obligatorio ? 'Obligatorio' : 'Opcional'}
      />
    ))
  )}
            </div>
          </div>

          {/* Customización formulario */}
          <div style={panelCardStyle}>
            <div
              style={{
                ...panelHeaderStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>🔧 Customización del Formulario de Postulación</span>
              <button
                type="button"
                onClick={() => setShowNewFieldForm((v) => !v)}
                disabled={!selectedFuente}
                style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
              >
                + Crear campo personalizado
              </button>
            </div>

            <div style={infoBoxStyle}>
              Instrucciones: Arrastra los campos para reordenarlos. Usa los controles para configurar visibilidad, obligatoriedad y tipo de campo.
            </div>

            {showNewFieldForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const tipo = String(formData.get('tipo') || 'texto')

                  const res = await crearCampoFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    tipo,
                  })

                  if (!res.success) {
                    alert(res.error)
                    return
                  }

                  setShowNewFieldForm(false)
                  router.refresh()
                }}
                style={inlineFormStyle}
              >
                <input
                  name="nombre"
                  placeholder="Nombre del campo"
                  required
                  style={inputStyle}
                />
                <select name="tipo" defaultValue="texto" style={inputStyle}>
                  <option value="texto">Texto</option>
                  <option value="texto_largo">Texto largo</option>
                  <option value="numero">Número</option>
                  <option value="fecha">Fecha</option>
                  <option value="booleano">Sí / No</option>
                </select>
                <button type="submit" style={saveButtonStyle}>
                  Guardar campo
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {camposFuente.length === 0 ? (
  <div style={{ fontSize: 13, color: '#6b7280' }}>
    No hay campos configurados para esta fuente.
  </div>
) : (
  camposFuente.map((campo) => (
    <FieldConfigRow
      key={campo.id}
      name={campo.nombre}
      type={campo.tipo}
      order={campo.orden}
    />
  ))
)}
            </div>
          </div>

          {/* Vista previa */}
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>👁️ Vista Previa del Formulario</div>

            <div style={previewWrapperStyle}>
              {[
                'Nombre del Proyecto',
                'Monto',
                'Unidad Responsable',
                'Diagnóstico',
                'Coordenadas',
                'Cronograma',
                'Evaluación técnica',
                'Indicadores sociales',
              ].map((field) => (
                <PreviewField key={field} label={field} />
              ))}
            </div>
          </div>

          {/* Reglas */}
          <div style={panelCardStyle}>
            <div
              style={{
                ...panelHeaderStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>🛡️ Reglas de Validación</span>
              <button
                type="button"
                onClick={() => setShowNewRuleForm((v) => !v)}
                disabled={!selectedFuente}
                style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
              >
                + Añadir regla
              </button>
            </div>

            {showNewRuleForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const descripcion = String(formData.get('descripcion') || '').trim()

                  const res = await crearReglaFuente({
                    fuente_id: selectedFuente.id,
                    descripcion,
                  })

                  if (!res.success) {
                    alert(res.error)
                    return
                  }

                  setShowNewRuleForm(false)
                  router.refresh()
                }}
                style={inlineFormStyle}
              >
                <input
                  name="descripcion"
                  placeholder="Descripción de la regla"
                  required
                  style={inputStyle}
                />
                <button type="submit" style={saveButtonStyle}>
                  Guardar regla
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reglasFuente.length === 0 ? (
  <div style={{ fontSize: 13, color: '#6b7280' }}>
    No hay reglas configuradas para esta fuente.
  </div>
) : (
  reglasFuente.map((regla) => (
    <RuleRow key={regla.id} text={regla.descripcion} />
  ))
)}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <button
              type="button"
              disabled
              title="Eliminar fuentes requiere definir reglas de seguridad y relaciones asociadas."
              style={disabledDangerButtonStyle}
            >
              Eliminar fuente
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setForm(toFormState(selectedFuente))}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedFuente || saving}
                style={darkButtonStyle}
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={textareaStyle}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function ToggleItem({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string
  subtitle: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={toggleItemStyle}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          border: 'none',
          background: checked ? '#111827' : '#e5e7eb',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: '#ffffff',
            transition: 'all .2s ease',
          }}
        />
      </button>
    </div>
  )
}

function SimpleRow({
  left,
  right,
}: {
  left: string
  right: string
}) {
  return (
    <div style={simpleRowStyle}>
      <span style={{ fontSize: 13, color: '#374151' }}>{left}</span>
      <span style={requiredBadgeStyle}>{right}</span>
    </div>
  )
}

function FieldConfigRow({
  name,
  type,
  order,
}: {
  name: string
  type: string
  order: number
}) {
  return (
    <div style={configRowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#9ca3af', fontWeight: 700 }}>⋮⋮</div>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: '#1d4ed8',
          }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Orden: {order}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={fieldTypeBadgeStyle}>{type}</span>
        <span style={{ color: '#ef4444' }}>◻</span>
        <span style={{ color: '#22c55e' }}>◉</span>
        <span style={{ color: '#ef4444' }}>🗑</span>
      </div>
    </div>
  )
}

function PreviewField({ label }: { label: string }) {
  return (
    <div style={previewFieldStyle}>
      <div style={fieldLabelStyle}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </div>
      <div style={previewInputStyle}>Ingrese {label.toLowerCase()}...</div>
    </div>
  )
}

function RuleRow({ text }: { text: string }) {
  return (
    <div style={ruleRowStyle}>
      <span style={{ fontSize: 13, color: '#92400e' }}>{text}</span>
      <span style={{ color: '#ef4444' }}>🗑</span>
    </div>
  )
}

const errorCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  borderRadius: 16,
  padding: 16,
}

const leftPanelStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  padding: 14,
}

const panelCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  padding: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 14,
}

const leftCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 12,
  textAlign: 'left',
  cursor: 'pointer',
  width: '100%',
}

const ghostAddButtonStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 600,
  cursor: 'pointer',
}

const topNewFormStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  padding: 16,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
}

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 14,
}

const twoColsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
}

const toggleGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginTop: 16,
}

const toggleItemStyle: React.CSSProperties = {
  borderRadius: 12,
  background: '#ffffff',
  border: '1px solid #f3f4f6',
  padding: 10,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const infoBoxStyle: React.CSSProperties = {
  borderRadius: 12,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  padding: 12,
  fontSize: 12,
  color: '#2563eb',
  marginBottom: 12,
  lineHeight: 1.6,
}

const previewWrapperStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const simpleRowStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #f3f4f6',
  background: '#ffffff',
  padding: '10px 12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const configRowStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

const previewFieldStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 12,
}

const previewInputStyle: React.CSSProperties = {
  marginTop: 8,
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  color: '#9ca3af',
  fontSize: 13,
}

const ruleRowStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #fde68a',
  background: '#fffbeb',
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const inlineFormStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 160px auto',
  gap: 10,
  alignItems: 'center',
  marginBottom: 14,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 12,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '0 12px',
  fontSize: 13,
  color: '#111827',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 70,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '10px 12px',
  fontSize: 13,
  color: '#111827',
  boxSizing: 'border-box',
  resize: 'vertical',
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  color: '#374151',
}

const requiredBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  padding: '0 8px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 700,
}

const fieldTypeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 24,
  padding: '0 8px',
  borderRadius: 999,
  background: '#f3f4f6',
  color: '#374151',
  fontSize: 11,
  fontWeight: 700,
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
}

const darkButtonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const miniDarkButtonStyle: React.CSSProperties = {
  height: 28,
  padding: '0 10px',
  borderRadius: 8,
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 11,
  cursor: 'pointer',
}

const disabledMiniButtonStyle: React.CSSProperties = {
  ...miniDarkButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
}

const saveButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: '#ef4444',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const disabledDangerButtonStyle: React.CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
}

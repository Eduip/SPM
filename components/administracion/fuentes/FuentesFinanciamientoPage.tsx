'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarCampoFuente,
  crearCampoFuente,
  crearDocumentoFuente,
  crearFuenteFinanciamiento,
  crearReglaFuente,
  eliminarCampoFuente,
  eliminarDocumentoFuente,
  eliminarFuenteFinanciamiento,
  guardarConfiguracionFuente,
} from '../../../app/administracion/fuentes-financiamiento/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'
import type {
  CampoPostulacion,
  DocumentoFuente,
  ReglaFuente,
} from '../../../lib/formulacion-types'
import type { FieldAIMode } from '../../../lib/ai/field-ai-config'

type FieldFormMode = 'descripcion' | 'plazo' | 'presupuesto'

type Fuente = {
  id: string
  nombre: string
  activo: boolean | null
  codigo: string | null
  descripcion: string | null
  requiere_evaluacion_tecnica: boolean | null
  requiere_rendicion_obligatoria: boolean | null
  requiere_aprobacion_externa: boolean | null
}

type FormState = {
  nombre: string
  codigo: string
  descripcion: string
  activo: boolean
  requiere_evaluacion_tecnica: boolean
  requiere_rendicion_obligatoria: boolean
  requiere_aprobacion_externa: boolean
}

const emptyForm: FormState = {
  nombre: '',
  codigo: '',
  descripcion: '',
  activo: true,
  requiere_evaluacion_tecnica: false,
  requiere_rendicion_obligatoria: false,
  requiere_aprobacion_externa: false,
}

const FIELD_TYPE_OPTIONS = [
  { value: 'texto', label: 'Texto', section: 'descripcion' },
  { value: 'texto_largo', label: 'Texto largo', section: 'descripcion' },
  { value: 'numero', label: 'Número', section: 'descripcion' },
  { value: 'fecha', label: 'Fecha', section: 'descripcion' },
  { value: 'booleano', label: 'Sí / No', section: 'descripcion' },
  { value: 'plazo', label: 'Plazo', section: 'plazo' },
  { value: 'presupuesto', label: 'Presupuesto', section: 'presupuesto' },
]

function getNewFieldPlaceholder(mode: FieldFormMode) {
  if (mode === 'plazo') return 'Nombre del plazo'
  if (mode === 'presupuesto') return 'Nombre de la partida presupuestaria'
  return 'Nombre del campo'
}

function getFieldSection(tipo: string): FieldFormMode {
  if (tipo === 'plazo') return 'plazo'
  if (tipo === 'presupuesto') return 'presupuesto'
  return 'descripcion'
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
  const [fieldFormMode, setFieldFormMode] = useState<FieldFormMode>('descripcion')
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false)
  const [showNewRuleForm, setShowNewRuleForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(fuentes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deletingFuente, setDeletingFuente] = useState(false)

  const selectedFuente = useMemo(
    () => fuentes.find((f) => f.id === selectedId) ?? fuentes[0] ?? null,
    [fuentes, selectedId]
  )

  const docsFuente = documentos.filter((d) => d.fuente_id === selectedFuente?.id)
  
  const camposFuente = campos
    .filter((c) => c.fuente_id === selectedFuente?.id && c.visible)
    .sort((a, b) => a.orden - b.orden)
  
  const reglasFuente = reglas.filter((r) => r.fuente_id === selectedFuente?.id)

  const [form, setForm] = useState<FormState>(() => toFormState(selectedFuente))

  const handleSelect = (fuente: Fuente) => {
    setSelectedId(fuente.id)
    setForm(toFormState(fuente))
    setShowNewFieldForm(false)
    setShowNewDocumentForm(false)
    setShowNewRuleForm(false)
  }

  const handleExport = () => {
    const rows = fuentes.map((fuente) => ({
      nombre: fuente.nombre,
      codigo: fuente.codigo ?? '',
      activo: fuente.activo ? 'Activa' : 'Inactiva',
      descripcion: fuente.descripcion ?? '',
    }))

    exportRowsToCsv('fuentes-financiamiento.csv', rows)
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
      },
    })

    setSaving(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  const handleDeleteFuente = async () => {
    if (!selectedFuente) return

    const confirmed = window.confirm(
      `¿Eliminar la fuente ${selectedFuente.nombre || 'seleccionada'}?`
    )

    if (!confirmed) return

    setDeletingFuente(true)

    const res = await eliminarFuenteFinanciamiento(selectedFuente.id)

    setDeletingFuente(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    setSelectedId(null)
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
              color: 'var(--text-strong)',
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
                      color: 'var(--text-strong)',
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
                onClick={() => setShowNewDocumentForm((v) => !v)}
                disabled={!selectedFuente}
                style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
              >
                + Añadir documento
              </button>
            </div>

            {showNewDocumentForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const obligatorio = formData.get('obligatorio') === 'on'

                  const res = await crearDocumentoFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    obligatorio,
                  })

                  if (!res.success) {
                    alert(res.error)
                    return
                  }

                  setShowNewDocumentForm(false)
                  router.refresh()
                }}
                style={inlineFormStyle}
              >
                <input
                  name="nombre"
                  placeholder="Nombre del documento"
                  required
                  style={inputStyle}
                />
                <label style={inlineCheckboxStyle}>
                  <input type="checkbox" name="obligatorio" defaultChecked />
                  Obligatorio
                </label>
                <button type="submit" style={saveButtonStyle}>
                  Guardar documento
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
{docsFuente.length === 0 ? (
    <div style={{ fontSize: 13, color: '#6b7280' }}>
      No hay documentos configurados para esta fuente.
    </div>
  ) : (
    docsFuente.map((doc) => (
      <DocumentRow
        key={doc.id}
        doc={doc}
        onDeleted={() => router.refresh()}
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFieldFormMode('descripcion')
                    setShowNewFieldForm((v) => !v || fieldFormMode !== 'descripcion')
                  }}
                  disabled={!selectedFuente}
                  style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
                >
                  + Crear descripción
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFieldFormMode('plazo')
                    setShowNewFieldForm((v) => !v || fieldFormMode !== 'plazo')
                  }}
                  disabled={!selectedFuente}
                  style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
                >
                  + Crear plazo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFieldFormMode('presupuesto')
                    setShowNewFieldForm((v) => !v || fieldFormMode !== 'presupuesto')
                  }}
                  disabled={!selectedFuente}
                  style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
                >
                  + Crear presupuesto
                </button>
              </div>
            </div>

            {showNewFieldForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const tipo =
                    fieldFormMode === 'descripcion'
                      ? String(formData.get('tipo') || 'texto')
                      : fieldFormMode
                  const obligatorio = formData.get('obligatorio') === 'on'

                  const res = await crearCampoFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    tipo,
                    obligatorio,
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
                  placeholder={getNewFieldPlaceholder(fieldFormMode)}
                  required
                  style={inputStyle}
                />
                {fieldFormMode === 'descripcion' ? (
                  <select name="tipo" defaultValue="texto" style={inputStyle}>
                    {FIELD_TYPE_OPTIONS.filter(
                      (option) => option.section === 'descripcion'
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={lockedTypeStyle}>
                    {fieldFormMode === 'plazo' ? 'Número para plazo' : 'Número para presupuesto'}
                  </div>
                )}
                <label style={inlineCheckboxStyle}>
                  <input type="checkbox" name="obligatorio" />
                  Obligatorio
                </label>
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
      key={`${campo.id}-${campo.tipo}-${campo.obligatorio}-${campo.nombre}`}
      campo={campo}
      onSaved={() => router.refresh()}
    />
  ))
)}
            </div>
          </div>

          {/* Vista previa */}
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>👁️ Vista Previa del Formulario</div>

            <div style={previewWrapperStyle}>
              {camposFuente.length === 0 ? (
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Esta fuente aún no tiene campos personalizados para previsualizar.
                </div>
              ) : (
                <PreviewSections campos={camposFuente} />
              )}
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
              onClick={handleDeleteFuente}
              disabled={!selectedFuente || deletingFuente}
              style={!selectedFuente ? disabledDangerButtonStyle : dangerButtonStyle}
            >
              {deletingFuente ? 'Eliminando...' : 'Eliminar fuente'}
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

function DocumentRow({
  doc,
  onDeleted,
}: {
  doc: DocumentoFuente
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar el documento ${doc.nombre}?`)
    if (!confirmed) return

    setDeleting(true)
    const res = await eliminarDocumentoFuente(doc.id)
    setDeleting(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    onDeleted()
  }

  return (
    <div style={simpleRowStyle}>
      <span style={{ fontSize: 13, color: '#374151' }}>{doc.nombre}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={requiredBadgeStyle}>
          {doc.obligatorio ? 'Obligatorio' : 'Opcional'}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={miniDangerButtonStyle}
        >
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}

function FieldConfigRow({
  campo,
  onSaved,
}: {
  campo: CampoPostulacion
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [nombre, setNombre] = useState(campo.nombre)
  const [tipo, setTipo] = useState(campo.tipo)
  const [obligatorio, setObligatorio] = useState(campo.obligatorio)
  const [aiMode, setAiMode] = useState<FieldAIMode>(
    campo.ai_mode ?? inferDefaultFieldAIMode(campo)
  )

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar el campo ${campo.nombre}?`)
    if (!confirmed) return

    setDeleting(true)
    const res = await eliminarCampoFuente(campo.id)
    setDeleting(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    onSaved()
  }

  return (
    <form
      action={async () => {
        setSaving(true)

        const res = await actualizarCampoFuente({
          id: campo.id,
          nombre: nombre.trim(),
          tipo,
          obligatorio,
          ai_mode: aiMode,
        })

        setSaving(false)

        if (!res.success) {
          alert(res.error)
          return
        }

        onSaved()
      }}
      style={configRowStyle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#9ca3af', fontWeight: 700 }}>⋮⋮</div>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            background: 'var(--primary-dark)',
          }}
        />
        <div>
          <input
            name="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            style={compactInputStyle}
          />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            Orden: {campo.orden}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select
          name="tipo"
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          style={compactSelectStyle}
        >
          {FIELD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label style={compactCheckboxStyle}>
          <input
            type="checkbox"
            name="obligatorio"
            checked={obligatorio}
            onChange={(event) => setObligatorio(event.target.checked)}
          />
          Obligatorio
        </label>
        <select
          value={aiMode}
          onChange={(event) => setAiMode(event.target.value as FieldAIMode)}
          style={compactSelectStyle}
        >
          <option value="blocked">Bloquear IA</option>
          <option value="suggest">Permitir IA</option>
          <option value="improve_only">Solo mejorar</option>
        </select>
        <button type="submit" disabled={saving || deleting} style={miniSecondaryButtonStyle}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          style={miniDangerButtonStyle}
        >
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </form>
  )
}

function inferDefaultFieldAIMode(campo: CampoPostulacion): FieldAIMode {
  if (!['texto', 'texto_largo'].includes(campo.tipo)) return 'blocked'

  const normalized = normalizeText(campo.nombre)
  const blockedTerms = [
    'bip',
    'codigo',
    'código',
    'rut',
    'folio',
    'resolucion',
    'resolución',
    'identificador',
    'cartola',
  ]

  return blockedTerms.some((term) => normalized.includes(normalizeText(term)))
    ? 'blocked'
    : 'suggest'
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function PreviewField({ campo }: { campo: CampoPostulacion }) {
  const placeholder =
    campo.tipo === 'fecha'
      ? 'Seleccione una fecha'
      : campo.tipo === 'booleano'
        ? 'Sí / No'
        : campo.tipo === 'plazo'
          ? '0 días'
          : campo.tipo === 'presupuesto'
            ? '$0'
        : `Ingrese ${campo.nombre.toLowerCase()}...`

  return (
    <div style={previewFieldStyle}>
      <div style={fieldLabelStyle}>
        {campo.nombre} {campo.obligatorio ? <span style={{ color: 'var(--danger)' }}>*</span> : null}
      </div>
      <div style={previewInputStyle}>{placeholder}</div>
    </div>
  )
}

function PreviewSections({ campos }: { campos: CampoPostulacion[] }) {
  const descripcion = campos.filter((campo) => getFieldSection(campo.tipo) === 'descripcion')
  const plazos = campos.filter((campo) => getFieldSection(campo.tipo) === 'plazo')
  const presupuestos = campos.filter((campo) => getFieldSection(campo.tipo) === 'presupuesto')

  return (
    <>
      <PreviewSection title="Descripción" campos={descripcion} emptyText="Sin campos de descripción." />
      <PreviewSection title="Plazos" campos={plazos} emptyText="Sin plazos configurados." totalLabel="Plazo total" totalValue="0 días" />
      <PreviewSection title="Presupuesto" campos={presupuestos} emptyText="Sin presupuesto configurado." totalLabel="Presupuesto total" totalValue="$0" />
    </>
  )
}

function PreviewSection({
  title,
  campos,
  emptyText,
  totalLabel,
  totalValue,
}: {
  title: string
  campos: CampoPostulacion[]
  emptyText: string
  totalLabel?: string
  totalValue?: string
}) {
  return (
    <div style={previewSectionStyle}>
      <div style={previewSectionTitleStyle}>{title}</div>
      {campos.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9ca3af' }}>{emptyText}</div>
      ) : (
        campos.map((campo) => <PreviewField key={campo.id} campo={campo} />)
      )}
      {totalLabel ? (
        <div style={previewTotalStyle}>
          <span>{totalLabel}</span>
          <strong>{totalValue}</strong>
        </div>
      ) : null}
    </div>
  )
}

function RuleRow({ text }: { text: string }) {
  return (
    <div style={ruleRowStyle}>
      <span style={{ fontSize: 13, color: '#92400e' }}>{text}</span>
      <span style={{ color: 'var(--danger)' }}>🗑</span>
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
  color: 'var(--text-strong)',
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
  color: 'var(--text-strong)',
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

const previewSectionStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const previewSectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const previewTotalStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '10px 12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
  fontWeight: 800,
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
  gridTemplateColumns: '1fr 160px auto auto',
  gap: 10,
  alignItems: 'center',
  marginBottom: 14,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 12,
}

const lockedTypeStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '0 12px',
  fontSize: 13,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  color: '#6b7280',
  fontWeight: 700,
}

const inlineCheckboxStyle: React.CSSProperties = {
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#374151',
  fontWeight: 600,
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
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const compactInputStyle: React.CSSProperties = {
  width: 220,
  height: 34,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '0 10px',
  fontSize: 13,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const compactSelectStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: '0 10px',
  fontSize: 12,
  color: '#374151',
}

const compactCheckboxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: '#374151',
  fontWeight: 600,
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 70,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--text-strong)',
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
  color: 'var(--danger)',
  fontSize: 11,
  fontWeight: 700,
}

const miniSecondaryButtonStyle: React.CSSProperties = {
  height: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#374151',
  fontWeight: 700,
  fontSize: 11,
  cursor: 'pointer',
}

const miniDangerButtonStyle: React.CSSProperties = {
  height: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fff1f2',
  color: '#be123c',
  fontWeight: 700,
  fontSize: 11,
  cursor: 'pointer',
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
  background: 'var(--text-strong)',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const miniDarkButtonStyle: React.CSSProperties = {
  height: 28,
  padding: '0 10px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--text-strong)',
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
  background: 'var(--success)',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const dangerButtonStyle: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--danger)',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
}

const disabledDangerButtonStyle: React.CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
}

'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarCampoFuente,
  actualizarSeccionFuente,
  crearCampoFuente,
  crearDocumentoEstadoPagoFuente,
  crearDocumentoFuente,
  crearFuenteFinanciamiento,
  crearReglaFuente,
  crearSeccionFuente,
  eliminarCampoFuente,
  eliminarDocumentoEstadoPagoFuente,
  eliminarDocumentoFuente,
  eliminarFuenteFinanciamiento,
  eliminarSeccionFuente,
  guardarConfiguracionFuente,
} from '../../../app/administracion/fuentes-financiamiento/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'
import { compareCampoOrder, getCampoOrderLabel } from '../../../lib/field-order'
import type {
  CampoPostulacion,
  DocumentoFuente,
  ReglaFuente,
  SeccionFormularioFuente,
  TableFieldCellAlign,
  TableFieldCellBackground,
  TableFieldCellConfig,
  TableFieldConfig,
  TableFieldCellVerticalAlign,
  TableFieldItemConfig,
  TableFieldItemKind,
} from '../../../lib/formulacion-types'
import type { FieldAIMode } from '../../../lib/ai/field-ai-config'
import type { EstadoPagoDocumentoConfig } from '../../../lib/estado-pago-document-config'
import {
  createDefaultTableFieldConfig,
  getTableCellPresentation,
  getRenderableTableCells,
  normalizeTableFieldConfig,
} from '../../../lib/table-field-config'

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
  { value: 'tabla_estructurada', label: 'Tabla estructurada', section: 'descripcion' },
  { value: 'plazo', label: 'Plazo', section: 'plazo' },
  { value: 'presupuesto', label: 'Presupuesto', section: 'presupuesto' },
]

const TABLE_ITEM_KIND_OPTIONS: Array<{ value: TableFieldItemKind; label: string }> = [
  { value: 'static_text', label: 'Texto fijo' },
  { value: 'input_text', label: 'Texto corto' },
  { value: 'input_textarea', label: 'Texto largo' },
  { value: 'input_number', label: 'Número' },
  { value: 'sum_numbers', label: 'Suma automática' },
]

const TABLE_CELL_BACKGROUND_OPTIONS: Array<{ value: TableFieldCellBackground; label: string }> = [
  { value: 'default', label: 'Blanco' },
  { value: 'soft_blue', label: 'Celeste suave' },
  { value: 'header', label: 'Encabezado azul' },
]

const TABLE_CELL_ALIGN_OPTIONS: Array<{ value: TableFieldCellAlign; label: string }> = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
]

const TABLE_CELL_VERTICAL_ALIGN_OPTIONS: Array<{
  value: TableFieldCellVerticalAlign
  label: string
}> = [
  { value: 'top', label: 'Arriba' },
  { value: 'middle', label: 'Centro' },
  { value: 'bottom', label: 'Abajo' },
]

function createUiConfigId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

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
    documentosEstadoPago,
    secciones,
    campos,
    reglas,
    error,
  }: {
    fuentes: Fuente[]
    documentos: DocumentoFuente[]
    documentosEstadoPago: EstadoPagoDocumentoConfig[]
    secciones: SeccionFormularioFuente[]
    campos: CampoPostulacion[]
    reglas: ReglaFuente[]
    error: string | null
  }) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [showNewFieldForm, setShowNewFieldForm] = useState(false)
  const [showNewSectionForm, setShowNewSectionForm] = useState(false)
  const [fieldFormMode, setFieldFormMode] = useState<FieldFormMode>('descripcion')
  const [showNewDocumentForm, setShowNewDocumentForm] = useState(false)
  const [showNewPaymentDocumentForm, setShowNewPaymentDocumentForm] = useState(false)
  const [showNewRuleForm, setShowNewRuleForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(fuentes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deletingFuente, setDeletingFuente] = useState(false)

  const selectedFuente = useMemo(
    () => (selectedId ? fuentes.find((f) => f.id === selectedId) ?? null : null),
    [fuentes, selectedId]
  )

  const docsFuente = documentos.filter((d) => d.fuente_id === selectedFuente?.id)
  const docsEstadoPagoFuente = documentosEstadoPago
    .filter((d) => d.fuenteId === selectedFuente?.id)
    .sort((a, b) => a.orden - b.orden)
  
  const camposFuente = campos
    .filter((c) => c.fuente_id === selectedFuente?.id && c.visible)
    .sort(compareCampoOrder)
  const seccionesFuente = secciones
    .filter((seccion) => seccion.fuente_id === selectedFuente?.id)
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
  
  const reglasFuente = reglas.filter((r) => r.fuente_id === selectedFuente?.id)

  const [form, setForm] = useState<FormState>(() => toFormState(selectedFuente))

  const handleStartNewFuente = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setShowNewForm(true)
    setShowNewFieldForm(false)
    setShowNewSectionForm(false)
    setShowNewDocumentForm(false)
    setShowNewPaymentDocumentForm(false)
    setShowNewRuleForm(false)
  }

  const handleSelect = (fuente: Fuente) => {
    setSelectedId(fuente.id)
    setForm(toFormState(fuente))
    setShowNewForm(false)
    setShowNewFieldForm(false)
    setShowNewSectionForm(false)
    setShowNewDocumentForm(false)
    setShowNewPaymentDocumentForm(false)
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
            onClick={handleStartNewFuente}
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
            if (res.success) {
              setForm(emptyForm)
            }
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
              onClick={handleStartNewFuente}
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

          <div style={panelCardStyle}>
            <div
              style={{
                ...panelHeaderStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>💳 Documentos para Estados de Pago</span>
              <button
                type="button"
                onClick={() => setShowNewPaymentDocumentForm((v) => !v)}
                disabled={!selectedFuente}
                style={!selectedFuente ? disabledMiniButtonStyle : miniDarkButtonStyle}
              >
                + Añadir documento
              </button>
            </div>

            {showNewPaymentDocumentForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const obligatorio = formData.get('obligatorio') === 'on'

                  const res = await crearDocumentoEstadoPagoFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    obligatorio,
                  })

                  if (!res.success) {
                    alert(res.error)
                    return
                  }

                  setShowNewPaymentDocumentForm(false)
                  router.refresh()
                }}
                style={inlineFormStyle}
              >
                <input
                  name="nombre"
                  placeholder="Nombre del documento para el estado de pago"
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
              {docsEstadoPagoFuente.length === 0 ? (
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  No hay documentos configurados para estados de pago en esta fuente.
                </div>
              ) : (
                docsEstadoPagoFuente.map((doc) => (
                  <PaymentDocumentRow
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
                  onClick={() => setShowNewSectionForm((v) => !v)}
                  disabled={!selectedFuente}
                  style={!selectedFuente ? disabledMiniButtonStyle : miniSecondaryButtonStyle}
                >
                  + Crear sección
                </button>
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

            {showNewSectionForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const orden = Number(formData.get('orden') || 0)

                  const res = await crearSeccionFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    orden,
                  })

                  if (!res.success) {
                    alert(res.error)
                    return
                  }

                  setShowNewSectionForm(false)
                  router.refresh()
                }}
                style={inlineFormStyle}
              >
                <input
                  name="nombre"
                  placeholder="Nombre de la sección"
                  required
                  style={inputStyle}
                />
                <input
                  name="orden"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Orden de la sección"
                  style={inputStyle}
                />
                <button type="submit" style={saveButtonStyle}>
                  Guardar sección
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {seccionesFuente.length === 0 ? (
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Aún no hay secciones creadas para esta fuente.
                </div>
              ) : (
                seccionesFuente.map((seccion) => (
                  <SectionRow key={seccion.id} seccion={seccion} onSaved={() => router.refresh()} />
                ))
              )}
            </div>

            {showNewFieldForm && selectedFuente && (
              <form
                action={async (formData) => {
                  const nombre = String(formData.get('nombre') || '').trim()
                  const descripcionCampo = String(formData.get('descripcion_campo') || '').trim()
                  const seccionId = String(formData.get('seccion_id') || '').trim()
                  const subgrupo = String(formData.get('subgrupo') || '').trim()
                  const ordenCodigo = String(formData.get('orden_codigo') || '').trim()
                  const tipo =
                    fieldFormMode === 'descripcion'
                      ? String(formData.get('tipo') || 'texto')
                      : fieldFormMode
                  const obligatorio = formData.get('obligatorio') === 'on'

                  const res = await crearCampoFuente({
                    fuente_id: selectedFuente.id,
                    nombre,
                    descripcion_campo: descripcionCampo,
                    seccion_id: seccionId,
                    grupo: '',
                    subgrupo,
                    orden_codigo: ordenCodigo,
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
                <input
                  name="descripcion_campo"
                  placeholder="Descripción del campo"
                  style={inputStyle}
                />
                <input
                  name="subgrupo"
                  placeholder="Subgrupo o subsección (opcional)"
                  style={inputStyle}
                />
                <select name="seccion_id" defaultValue="" style={inputStyle}>
                  <option value="">Sin sección</option>
                  {seccionesFuente.map((seccion) => (
                    <option key={seccion.id} value={seccion.id}>
                      {seccion.orden}. {seccion.nombre}
                    </option>
                  ))}
                </select>
                <input
                  name="orden_codigo"
                  placeholder="Orden visible (ej: 1, 1.2, 4.3)"
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
      secciones={seccionesFuente}
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

function PaymentDocumentRow({
  doc,
  onDeleted,
}: {
  doc: EstadoPagoDocumentoConfig
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar el documento ${doc.nombre}?`)
    if (!confirmed) return

    setDeleting(true)
    const res = await eliminarDocumentoEstadoPagoFuente(doc.id)
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
  secciones,
  onSaved,
}: {
  campo: CampoPostulacion
  secciones: SeccionFormularioFuente[]
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [nombre, setNombre] = useState(campo.nombre)
  const [descripcionCampo, setDescripcionCampo] = useState(campo.descripcion_campo ?? '')
  const [seccionId, setSeccionId] = useState(campo.seccion_id ?? '')
  const [subgrupo, setSubgrupo] = useState(campo.subgrupo ?? '')
  const [ordenCodigo, setOrdenCodigo] = useState(campo.orden_codigo ?? String(campo.orden))
  const [tipo, setTipo] = useState(campo.tipo)
  const [tableConfig, setTableConfig] = useState<TableFieldConfig>(() =>
    normalizeTableFieldConfig(campo.config_json)
  )
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
          descripcion_campo: descripcionCampo,
          seccion_id: seccionId,
          grupo: '',
          subgrupo,
          orden_codigo: ordenCodigo,
          config_json: tipo === 'tabla_estructurada' ? tableConfig : null,
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
      style={{
        ...configRowStyle,
        alignItems: 'stretch',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                Orden visible actual: {getCampoOrderLabel(campo)} · Orden interno: {campo.orden}
              </div>
            </div>
          </div>
          <input
            value={ordenCodigo}
            onChange={(event) => setOrdenCodigo(event.target.value)}
            placeholder="Orden visible (ej: 1, 1.2, 4.3)"
            style={compactInputStyle}
          />
          <input
            value={descripcionCampo}
            onChange={(event) => setDescripcionCampo(event.target.value)}
            placeholder="Descripción del campo"
            style={compactInputStyle}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select
              value={seccionId}
              onChange={(event) => setSeccionId(event.target.value)}
              style={compactSelectStyle}
            >
              <option value="">Sin sección</option>
              {secciones.map((seccion) => (
                <option key={seccion.id} value={seccion.id}>
                  {seccion.orden}. {seccion.nombre}
                </option>
              ))}
            </select>
            <input
              value={subgrupo}
              onChange={(event) => setSubgrupo(event.target.value)}
              placeholder="Subgrupo o subsección"
              style={compactInputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <select
            name="tipo"
            value={tipo}
            onChange={(event) => {
              const nextType = event.target.value
              setTipo(nextType)
              if (nextType === 'tabla_estructurada') {
                setTableConfig((current) => normalizeTableFieldConfig(current))
              }
            }}
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
            disabled={tipo === 'tabla_estructurada'}
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
      </div>
      {tipo === 'tabla_estructurada' ? (
        <div style={{ width: '100%' }}>
          <TableFieldConfigEditor config={tableConfig} onChange={setTableConfig} />
        </div>
      ) : null}
    </form>
  )
}

function TableFieldConfigEditor({
  config,
  onChange,
}: {
  config: TableFieldConfig
  onChange: (config: TableFieldConfig) => void
}) {
  const normalized = normalizeTableFieldConfig(config)

  const updateColumnHeader = (columnIndex: number, header: string) => {
    const next = normalizeTableFieldConfig(normalized)
    next.columns[columnIndex].header = header
    onChange(next)
  }

  const addColumn = () => {
    const next = normalizeTableFieldConfig(normalized)
    const columnId = createUiConfigId('col')
    next.columns.push({ id: columnId, header: `Columna ${next.columns.length + 1}` })
    next.rows = next.rows.map((row) => ({
      ...row,
      cells: [
        ...row.cells,
        {
          id: createUiConfigId('cell'),
          colspan: 1,
          items: [
            {
              id: createUiConfigId('item'),
              kind: 'input_text',
              label: 'Dato',
              text: '',
              placeholder: 'Ingrese contenido',
              highlighted: false,
            },
          ],
        },
      ],
    }))
    onChange(next)
  }

  const addRow = () => {
    const next = normalizeTableFieldConfig(normalized)
    next.rows.push({
      id: createUiConfigId('row'),
      variant: 'body',
      cells: next.columns.map((column, index) => ({
        id: createUiConfigId(`cell-${column.id}`),
        colspan: 1,
        background: index === 0 ? 'soft_blue' : 'default',
        align: index === 0 ? 'center' : 'left',
        vertical_align: index === 0 ? 'middle' : 'top',
        items: [
          {
            id: createUiConfigId(`item-${column.id}`),
            kind: index === 0 ? 'static_text' : 'input_text',
            label: index === 0 ? '' : 'Dato',
            text: index === 0 ? 'Texto de referencia' : '',
            placeholder: index === 0 ? '' : 'Ingrese contenido',
            highlighted: false,
          },
        ],
      })),
    })
    onChange(next)
  }

  const updateCellItems = (rowIndex: number, cellIndex: number, items: TableFieldItemConfig[]) => {
    const next = normalizeTableFieldConfig(normalized)
    next.rows[rowIndex].cells[cellIndex].items = items
    onChange(next)
  }

  const updateCellColspan = (rowIndex: number, cellIndex: number, colspan: number) => {
    const next = normalizeTableFieldConfig(normalized)
    next.rows[rowIndex].cells[cellIndex].colspan = Math.max(1, Math.floor(colspan || 1))
    onChange(next)
  }

  const updateRowVariant = (rowIndex: number, variant: 'body' | 'header') => {
    const next = normalizeTableFieldConfig(normalized)
    next.rows[rowIndex].variant = variant
    onChange(next)
  }

  const updateCellPresentation = (
    rowIndex: number,
    cellIndex: number,
    patch: Partial<TableFieldCellConfig>
  ) => {
    const next = normalizeTableFieldConfig(normalized)
    next.rows[rowIndex].cells[cellIndex] = {
      ...next.rows[rowIndex].cells[cellIndex],
      ...patch,
    }
    onChange(next)
  }

  return (
    <div style={tableEditorWrapperStyle}>
      <div style={tableEditorTitleStyle}>Configuración de la tabla</div>
      <div style={tableEditorActionRowStyle}>
        <button type="button" onClick={addColumn} style={miniSecondaryButtonStyle}>
          + Columna
        </button>
        <button type="button" onClick={addRow} style={miniSecondaryButtonStyle}>
          + Fila
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableEditorTableStyle}>
          <thead>
            <tr>
              {normalized.columns.map((column, columnIndex) => (
                <th key={column.id} style={tableEditorHeaderStyle}>
                  <input
                    value={column.header}
                    onChange={(event) => updateColumnHeader(columnIndex, event.target.value)}
                    placeholder={`Encabezado ${columnIndex + 1}`}
                    style={tableHeaderInputStyle}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalized.rows.map((row, rowIndex) => (
              <Fragment key={row.id}>
                <tr key={`${row.id}-meta`}>
                  <td colSpan={normalized.columns.length} style={tableRowMetaCellStyle}>
                    <div style={tableRowMetaContentStyle}>
                      <span style={tableRowMetaLabelStyle}>Fila {rowIndex + 1}</span>
                      <select
                        value={row.variant ?? 'body'}
                        onChange={(event) =>
                          updateRowVariant(rowIndex, event.target.value as 'body' | 'header')
                        }
                        style={compactSelectStyle}
                      >
                        <option value="body">Fila normal</option>
                        <option value="header">Fila encabezado</option>
                      </select>
                    </div>
                  </td>
                </tr>
                <tr key={row.id}>
                  {getRenderableTableCells(row, normalized.columns.length).map(
                    ({ cell, cellIndex, colspan }) => (
                      <td
                        key={cell.id}
                        colSpan={colspan}
                        style={{
                          ...tableEditorCellStyle,
                          background: getTableCellPresentation(row, cell).background,
                        }}
                      >
                        <TableCellEditor
                          cell={cell}
                          maxColumns={normalized.columns.length}
                          onChange={(items) => updateCellItems(rowIndex, cellIndex, items)}
                          onChangeColspan={(nextColspan) =>
                            updateCellColspan(rowIndex, cellIndex, nextColspan)
                          }
                          onChangePresentation={(patch) =>
                            updateCellPresentation(rowIndex, cellIndex, patch)
                          }
                        />
                      </td>
                    )
                  )}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableCellEditor({
  cell,
  maxColumns,
  onChange,
  onChangeColspan,
  onChangePresentation,
}: {
  cell: TableFieldCellConfig
  maxColumns: number
  onChange: (items: TableFieldItemConfig[]) => void
  onChangeColspan: (colspan: number) => void
  onChangePresentation: (patch: Partial<TableFieldCellConfig>) => void
}) {
  const items = Array.isArray(cell.items)
    ? cell.items
    : createDefaultTableFieldConfig().rows[0].cells[0].items

  const updateItem = (
    itemIndex: number,
    patch: Partial<TableFieldItemConfig>
  ) => {
    const next = items.map((item, index) =>
      index === itemIndex
        ? {
            ...item,
            ...patch,
          }
        : item
    )
    onChange(next)
  }

  const addItem = () => {
    onChange([
      ...items,
      {
        id: createUiConfigId('item'),
        kind: 'static_text',
        label: '',
        text: '',
        placeholder: '',
        highlighted: false,
      },
    ])
  }

  const removeItem = (itemIndex: number) => {
    const next = items.filter((_, index) => index !== itemIndex)
    onChange(next)
  }

  return (
    <div style={tableCellEditorStyle}>
      {items.map((item, itemIndex) => (
        <div key={item.id} style={tableItemCardStyle}>
          <div style={tableItemRowStyle}>
            <select
              value={item.kind}
              onChange={(event) =>
                updateItem(itemIndex, {
                  kind: event.target.value as TableFieldItemKind,
                })
              }
              style={compactSelectStyle}
            >
              {TABLE_ITEM_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label style={compactCheckboxStyle}>
              <input
                type="checkbox"
                checked={Boolean(item.highlighted)}
                onChange={(event) =>
                  updateItem(itemIndex, {
                    highlighted: event.target.checked,
                  })
                }
              />
              Resaltar
            </label>
            <label style={tableColspanLabelStyle}>
              Ancho
              <input
                type="number"
                min="1"
                max={maxColumns}
                value={cell.colspan ?? 1}
                onChange={(event) => onChangeColspan(Number(event.target.value || 1))}
                style={tableColspanInputStyle}
              />
            </label>
            <button type="button" onClick={() => removeItem(itemIndex)} style={miniDangerButtonStyle}>
              Quitar
            </button>
          </div>
          <div style={tableItemRowStyle}>
            <select
              value={cell.background ?? 'default'}
              onChange={(event) =>
                onChangePresentation({
                  background: event.target.value as TableFieldCellBackground,
                })
              }
              style={compactSelectStyle}
            >
              {TABLE_CELL_BACKGROUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Fondo: {option.label}
                </option>
              ))}
            </select>
            <select
              value={cell.align ?? 'left'}
              onChange={(event) =>
                onChangePresentation({
                  align: event.target.value as TableFieldCellAlign,
                })
              }
              style={compactSelectStyle}
            >
              {TABLE_CELL_ALIGN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Alinear: {option.label}
                </option>
              ))}
            </select>
            <select
              value={cell.vertical_align ?? 'top'}
              onChange={(event) =>
                onChangePresentation({
                  vertical_align: event.target.value as TableFieldCellVerticalAlign,
                })
              }
              style={compactSelectStyle}
            >
              {TABLE_CELL_VERTICAL_ALIGN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Vertical: {option.label}
                </option>
              ))}
            </select>
          </div>
          {item.kind === 'static_text' ? (
              <textarea
              value={item.text ?? ''}
              onChange={(event) => updateItem(itemIndex, { text: event.target.value })}
              placeholder="Texto fijo o instrucción"
              style={{
                width: '100%',
                minHeight: 76,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#fff',
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-strong)',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          ) : (
            <>
              <input
                value={item.label ?? ''}
                onChange={(event) => updateItem(itemIndex, { label: event.target.value })}
                placeholder="Etiqueta"
                style={compactInputStyle}
              />
              {item.kind !== 'sum_numbers' ? (
                <input
                  value={item.placeholder ?? ''}
                  onChange={(event) => updateItem(itemIndex, { placeholder: event.target.value })}
                  placeholder="Placeholder"
                  style={compactInputStyle}
                />
              ) : (
                <div style={tableInfoTextStyle}>
                  La suma automática totaliza los números ingresados en esta celda.
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <button type="button" onClick={addItem} style={miniSecondaryButtonStyle}>
        + Item en celda
      </button>
    </div>
  )
}

function SectionRow({
  seccion,
  onSaved,
}: {
  seccion: SeccionFormularioFuente
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(seccion.nombre)
  const [orden, setOrden] = useState(String(seccion.orden))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Eliminar la sección ${seccion.nombre}?`)
    if (!confirmed) return

    setDeleting(true)
    const res = await eliminarSeccionFuente(seccion.id)
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
        const res = await actualizarSeccionFuente({
          id: seccion.id,
          nombre,
          orden: Number(orden || 0),
        })
        setSaving(false)

        if (!res.success) {
          alert(res.error)
          return
        }

        onSaved()
      }}
      style={simpleRowStyle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <input
          value={orden}
          onChange={(event) => setOrden(event.target.value)}
          type="number"
          min="1"
          step="1"
          style={{ ...compactInputStyle, width: 84 }}
        />
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          style={{ ...compactInputStyle, flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
  if (campo.tipo === 'tabla_estructurada') {
    const config = normalizeTableFieldConfig(campo.config_json)
    return (
      <div style={{ ...previewFieldStyle, overflowX: 'auto' }}>
        <div style={fieldLabelStyle}>
          {campo.nombre} {campo.obligatorio ? <span style={{ color: 'var(--danger)' }}>*</span> : null}
        </div>
        {campo.descripcion_campo ? (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>
            {campo.descripcion_campo}
          </div>
        ) : null}
        <table style={tablePreviewTableStyle}>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column.id} style={tablePreviewHeaderStyle}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row) => (
              <tr key={row.id}>
                {getRenderableTableCells(row, config.columns.length).map(({ cell, colspan }) => (
                  <td
                    key={cell.id}
                    colSpan={colspan}
                    style={{
                      ...tablePreviewCellStyle,
                      background: getTableCellPresentation(row, cell).background,
                      textAlign: getTableCellPresentation(row, cell).textAlign,
                      verticalAlign: getTableCellPresentation(row, cell).verticalAlign,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        justifyContent: getTableCellPresentation(row, cell).justifyContent,
                        minHeight: 110,
                      }}
                    >
                      {cell.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            ...(item.highlighted ? tablePreviewHighlightedStyle : undefined),
                            fontWeight: item.highlighted
                              ? tablePreviewHighlightedStyle.fontWeight
                              : getTableCellPresentation(row, cell).fontWeight,
                          }}
                        >
                          {item.kind === 'static_text'
                            ? item.text || 'Texto fijo'
                            : item.kind === 'sum_numbers'
                              ? 'Suma automática'
                              : `${item.label || 'Campo'}: ${
                                  item.kind === 'input_number'
                                    ? '0'
                                    : item.kind === 'input_textarea'
                                      ? 'Texto largo'
                                      : 'Texto'
                                }`}
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

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
      {campo.descripcion_campo ? (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, lineHeight: 1.4 }}>
          {campo.descripcion_campo}
        </div>
      ) : null}
      <div style={previewInputStyle}>{placeholder}</div>
    </div>
  )
}

function PreviewSections({ campos }: { campos: CampoPostulacion[] }) {
  const descripcion = campos
    .filter((campo) => getFieldSection(campo.tipo) === 'descripcion')
    .sort(compareCampoOrder)
  const plazos = campos
    .filter((campo) => getFieldSection(campo.tipo) === 'plazo')
    .sort(compareCampoOrder)
  const presupuestos = campos
    .filter((campo) => getFieldSection(campo.tipo) === 'presupuesto')
    .sort(compareCampoOrder)

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
  const grouped = groupCamposByHierarchy(campos)

  return (
    <div style={previewSectionStyle}>
      <div style={previewSectionTitleStyle}>{title}</div>
      {campos.length === 0 ? (
        <div style={{ fontSize: 13, color: '#9ca3af' }}>{emptyText}</div>
      ) : (
        grouped.map((group) => (
          <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.grupo ? <div style={previewGroupTitleStyle}>{group.grupo}</div> : null}
            {group.subgroups.map((subgroup) => (
              <div key={subgroup.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subgroup.subgrupo ? (
                  <div style={previewSubgroupTitleStyle}>{subgroup.subgrupo}</div>
                ) : null}
                {subgroup.campos.map((campo) => (
                  <PreviewField key={campo.id} campo={campo} />
                ))}
              </div>
            ))}
          </div>
        ))
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

function groupCamposByHierarchy(campos: CampoPostulacion[]) {
  const groupMap = new Map<
    string,
    {
      key: string
      grupo: string | null
      subgroups: Array<{
        key: string
        subgrupo: string | null
        campos: CampoPostulacion[]
      }>
    }
  >()

  for (const campo of campos) {
    const grupo = campo.seccion_nombre?.trim() || null
    const subgrupo = campo.subgrupo?.trim() || null
    const groupKey = grupo ?? '__sin_grupo__'

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        key: groupKey,
        grupo,
        subgroups: [],
      })
    }

    const group = groupMap.get(groupKey)!
    const subgroupKey = subgrupo ?? '__sin_subgrupo__'
    let subgroup = group.subgroups.find((item) => item.key === subgroupKey)

    if (!subgroup) {
      subgroup = {
        key: subgroupKey,
        subgrupo,
        campos: [],
      }
      group.subgroups.push(subgroup)
    }

    subgroup.campos.push(campo)
  }

  return Array.from(groupMap.values())
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
  alignItems: 'stretch',
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

const previewGroupTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--primary-dark)',
}

const previewSubgroupTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#4b5563',
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

const tableEditorWrapperStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #dbeafe',
  background: '#f8fbff',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const tableEditorTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--primary-dark)',
}

const tableEditorActionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const tableEditorTableStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 760,
  borderCollapse: 'collapse',
}

const tableEditorHeaderStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#e2e8f0',
  padding: 8,
  verticalAlign: 'top',
}

const tableEditorCellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  padding: 8,
  verticalAlign: 'top',
}

const tableRowMetaCellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#f8fafc',
  padding: '8px 12px',
}

const tableRowMetaContentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

const tableRowMetaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#475569',
}

const tableCellEditorStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  background: '#fff',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const tableItemCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  background: '#f9fafb',
}

const tableItemRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
}

const tableColspanLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: '#4b5563',
}

const tableColspanInputStyle: React.CSSProperties = {
  width: 56,
  height: 32,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: '0 8px',
  fontSize: 12,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const tableInfoTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.45,
}

const tableHeaderInputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  padding: '0 12px',
  fontSize: 13,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
  fontWeight: 700,
  backgroundColor: '#eff6ff',
}

const tablePreviewTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 520,
}

const tablePreviewHeaderStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#e2e8f0',
  color: 'var(--text-strong)',
  textAlign: 'center',
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 800,
}

const tablePreviewCellStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  verticalAlign: 'top',
  padding: '10px 12px',
  fontSize: 13,
  color: '#374151',
}

const tablePreviewHighlightedStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#fef08a',
  padding: '2px 4px',
  fontWeight: 800,
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

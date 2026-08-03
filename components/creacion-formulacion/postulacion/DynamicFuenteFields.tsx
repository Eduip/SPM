'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  guardarRespuestaDinamica,
  sugerirCampoPostulacionConIA,
} from '../../../app/creacion-formulacion/postulacion/dynamic-actions'
import { compareCampoOrder } from '../../../lib/field-order'
import type {
  CampoPostulacion,
  DynamicFieldValue,
  RespuestaPostulacion,
} from '../../../lib/formulacion-types'

export default function DynamicFuenteFields({
  proyectoId,
  fuenteId,
  fuenteNombre,
  campos,
  respuestasIniciales,
}: {
  proyectoId: string
  fuenteId: string | null
  fuenteNombre: string
  campos: CampoPostulacion[]
  respuestasIniciales?: RespuestaPostulacion[] | null
}) {
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null)
  const [aiLoadingFieldId, setAiLoadingFieldId] = useState<string | null>(null)
  const [aiMessageFieldId, setAiMessageFieldId] = useState<string | null>(null)
  const [fieldFeedback, setFieldFeedback] = useState<
    Record<string, { tone: 'success' | 'warning' | 'error'; message: string }>
  >({})
  const safeRespuestas = useMemo(
    () => (Array.isArray(respuestasIniciales) ? respuestasIniciales : []),
    [respuestasIniciales]
  )

  const camposActivos = useMemo(() => {
    if (!fuenteId) return []
    return campos
      .filter((c) => String(c.fuente_id) === String(fuenteId) && c.visible)
      .sort(compareCampoOrder)
  }, [campos, fuenteId])

  const respuestaMap = useMemo(() => {
    const map = new Map<string, DynamicFieldValue>()
    for (const r of safeRespuestas) {
      if (r.valor_texto !== null) map.set(r.campo_id, r.valor_texto)
      else if (r.valor_numero !== null) map.set(r.campo_id, String(r.valor_numero))
      else if (r.valor_booleano !== null) map.set(r.campo_id, r.valor_booleano)
      else if (r.valor_fecha !== null) map.set(r.campo_id, r.valor_fecha)
      else if (r.valor_json !== null) map.set(r.campo_id, r.valor_json)
    }
    return map
  }, [safeRespuestas])

  const [values, setValues] = useState<Record<string, DynamicFieldValue>>(() => {
    const initial: Record<string, DynamicFieldValue> = {}
    for (const campo of camposActivos) {
      initial[campo.id] = respuestaMap.get(campo.id) ?? defaultValueForType(campo.tipo)
    }
    return initial
  })

  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev }

      for (const campo of camposActivos) {
        if (!(campo.id in next)) {
          next[campo.id] = respuestaMap.get(campo.id) ?? defaultValueForType(campo.tipo)
        }
      }

      return next
    })
  }, [camposActivos, respuestaMap])
  const camposDescripcion = camposActivos.filter(
    (campo) => getFieldSection(campo.tipo) === 'descripcion'
  )
  const camposPlazo = camposActivos.filter((campo) => getFieldSection(campo.tipo) === 'plazo')
  const camposPresupuesto = camposActivos.filter(
    (campo) => getFieldSection(campo.tipo) === 'presupuesto'
  )
  const plazoTotal = sumFieldValues(camposPlazo, values)
  const presupuestoTotal = sumFieldValues(camposPresupuesto, values)

  if (!fuenteId) {
    return (
      <div
        style={{
          borderRadius: 16,
          background: 'var(--primary-tint)',
          border: '1px solid var(--primary-soft)',
          padding: 16,
          color: 'var(--primary-dark)',
          fontSize: 14,
        }}
      >
        Selecciona una fuente de financiamiento para cargar los campos dinámicos.
      </div>
    )
  }

  if (camposActivos.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          background: '#f9fafb',
          border: '1px solid var(--border)',
          padding: 16,
          color: 'var(--text-muted)',
          fontSize: 14,
        }}
      >
        {fuenteNombre
          ? `${fuenteNombre} aún no tiene campos configurados.`
          : 'Esta fuente aún no tiene campos configurados.'}
      </div>
    )
  }

  const handleBlurSave = async (campo: CampoPostulacion, value: DynamicFieldValue) => {
    setSavingFieldId(campo.id)
    setFieldFeedback((prev) => {
      const next = { ...prev }
      delete next[campo.id]
      return next
    })

    try {
      const result = await guardarRespuestaDinamica({
        proyectoId,
        fuenteId,
        campoId: campo.id,
        tipo: campo.tipo,
        valor: value,
      })

      if (!result.success) {
        setFieldFeedback((prev) => ({
          ...prev,
          [campo.id]: {
            tone: 'error',
            message: result.error || 'No se pudo guardar el campo.',
          },
        }))
      }
    } catch (error) {
      setFieldFeedback((prev) => ({
        ...prev,
        [campo.id]: {
          tone: 'error',
          message:
            error instanceof Error ? error.message : 'Ocurrió un error inesperado al guardar.',
        },
      }))
    } finally {
      setSavingFieldId(null)
    }
  }

  const handleAISuggestion = async (campo: CampoPostulacion) => {
    setAiLoadingFieldId(campo.id)
    setAiMessageFieldId(null)
    setFieldFeedback((prev) => {
      const next = { ...prev }
      delete next[campo.id]
      return next
    })

    try {
      const result = await sugerirCampoPostulacionConIA({
        proyectoId,
        fuenteId,
        campoId: campo.id,
        tituloCampo: campo.nombre,
        tipo: campo.tipo,
        valorActual: fieldValueToString(values[campo.id] ?? ''),
      })

      if (!result.success) {
        setFieldFeedback((prev) => ({
          ...prev,
          [campo.id]: {
            tone: 'error',
            message: result.error || 'No se pudo generar la sugerencia IA.',
          },
        }))
        return
      }

      const suggestion = String(result.suggestion ?? '').trim()

      if (!suggestion) {
        setFieldFeedback((prev) => ({
          ...prev,
          [campo.id]: {
            tone: 'error',
            message: 'La IA no devolvió contenido para este campo.',
          },
        }))
        return
      }

      setValues((prev) => ({ ...prev, [campo.id]: suggestion }))
      setAiMessageFieldId(campo.id)
      setFieldFeedback((prev) => ({
        ...prev,
        [campo.id]: {
          tone: result.mode === 'local' ? 'warning' : 'success',
          message:
            result.notice ||
            (result.mode === 'local'
              ? 'Se aplicó una sugerencia local de respaldo.'
              : 'Sugerencia IA aplicada y guardada.'),
        },
      }))
      await handleBlurSave(campo, suggestion)
    } catch (error) {
      setFieldFeedback((prev) => ({
        ...prev,
        [campo.id]: {
          tone: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Ocurrió un error inesperado al consultar la IA.',
        },
      }))
    } finally {
      setAiLoadingFieldId(null)
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding: 22,
        border: '1px solid var(--border)',
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 18,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-strong)',
        }}
      >
        Formulario de Postulación
      </h3>
      <div
        style={{
          marginTop: -12,
          marginBottom: 18,
          fontSize: 14,
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}
      >
        Fuente seleccionada: {fuenteNombre}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FieldSection
          title="Descripción"
          campos={camposDescripcion}
          values={values}
          savingFieldId={savingFieldId}
          emptyText="No hay campos de descripción configurados."
          aiLoadingFieldId={aiLoadingFieldId}
          aiMessageFieldId={aiMessageFieldId}
          fieldFeedback={fieldFeedback}
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
          onAISuggest={handleAISuggestion}
        />
        <FieldSection
          title="Plazos"
          campos={camposPlazo}
          values={values}
          savingFieldId={savingFieldId}
          aiLoadingFieldId={aiLoadingFieldId}
          aiMessageFieldId={aiMessageFieldId}
          fieldFeedback={fieldFeedback}
          emptyText="No hay campos de plazo configurados."
          totalLabel="Plazo total"
          totalValue={`${plazoTotal} días`}
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
          onAISuggest={handleAISuggestion}
        />
        <FieldSection
          title="Presupuesto"
          campos={camposPresupuesto}
          values={values}
          savingFieldId={savingFieldId}
          aiLoadingFieldId={aiLoadingFieldId}
          aiMessageFieldId={aiMessageFieldId}
          fieldFeedback={fieldFeedback}
          emptyText="No hay campos de presupuesto configurados."
          totalLabel="Presupuesto total"
          totalValue={`CLP ${new Intl.NumberFormat('es-CL').format(presupuestoTotal)}`}
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
          onAISuggest={handleAISuggestion}
        />
      </div>
    </div>
  )
}

function FieldSection({
  title,
  campos,
  values,
  savingFieldId,
  aiLoadingFieldId,
  aiMessageFieldId,
  fieldFeedback,
  emptyText,
  totalLabel,
  totalValue,
  onChange,
  onBlur,
  onAISuggest,
}: {
  title: string
  campos: CampoPostulacion[]
  values: Record<string, DynamicFieldValue>
  savingFieldId: string | null
  aiLoadingFieldId: string | null
  aiMessageFieldId: string | null
  fieldFeedback: Record<string, { tone: 'success' | 'warning' | 'error'; message: string }>
  emptyText: string
  totalLabel?: string
  totalValue?: string
  onChange: (campoId: string, value: DynamicFieldValue) => void
  onBlur: (campo: CampoPostulacion, value: DynamicFieldValue) => void
  onAISuggest: (campo: CampoPostulacion) => void
}) {
  const grouped = groupCamposByHierarchy(campos)

  return (
    <section style={sectionStyle}>
      <h4 style={sectionTitleStyle}>{title}</h4>
      {campos.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {grouped.map((group) => (
            <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {group.grupo ? <div style={groupTitleStyle}>{group.grupo}</div> : null}
              {group.subgroups.map((subgroup) => (
                <div key={subgroup.key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {subgroup.subgrupo ? <div style={subgroupTitleStyle}>{subgroup.subgrupo}</div> : null}
                  <div style={fieldsGridStyle}>
                    {subgroup.campos.map((campo) => (
                      <FieldRow
                        key={campo.id}
                        campo={campo}
                        value={values[campo.id] ?? defaultValueForType(campo.tipo)}
                        aiLoadingFieldId={aiLoadingFieldId}
                        aiMessageFieldId={aiMessageFieldId}
                        feedback={fieldFeedback[campo.id] ?? null}
                        savingFieldId={savingFieldId}
                        onChange={(newValue) => onChange(campo.id, newValue)}
                        onBlur={() => onBlur(campo, values[campo.id])}
                        onAISuggest={() => onAISuggest(campo)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {totalLabel ? (
        <div style={totalStyle}>
          <span>{totalLabel}</span>
          <strong>{totalValue}</strong>
        </div>
      ) : null}
    </section>
  )
}

function FieldRow({
  campo,
  value,
  savingFieldId,
  aiLoadingFieldId,
  aiMessageFieldId,
  feedback,
  onChange,
  onBlur,
  onAISuggest,
}: {
  campo: CampoPostulacion
  value: DynamicFieldValue
  savingFieldId: string | null
  aiLoadingFieldId: string | null
  aiMessageFieldId: string | null
  feedback: { tone: 'success' | 'warning' | 'error'; message: string } | null
  onChange: (value: DynamicFieldValue) => void
  onBlur: () => void
  onAISuggest: () => void
}) {
  const aiAvailability = getFieldAIAvailability(campo, value)
  const usesExpandedTextField =
    campo.tipo === 'texto' &&
    (aiAvailability.showButton || fieldValueToString(value).trim().length > 80)

  return (
    <div
      style={{
        gridColumn: campo.tipo === 'texto_largo' ? '1 / -1' : 'auto',
      }}
    >
      <label style={labelStyle}>
        {campo.nombre} {campo.obligatorio ? <span style={{ color: 'var(--danger)' }}>*</span> : null}
      </label>
      {campo.descripcion_campo ? (
        <div style={descriptionStyle}>{campo.descripcion_campo}</div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {aiAvailability.message}
        </div>
        {aiAvailability.showButton ? (
          <button
            type="button"
            onClick={onAISuggest}
            disabled={aiLoadingFieldId === campo.id}
            style={aiButtonStyle(aiLoadingFieldId === campo.id)}
          >
            <Sparkles size={13} />
            {aiAvailability.buttonLabel}
          </button>
        ) : null}
      </div>

      {renderField({
        campo,
        value,
        expandedText: usesExpandedTextField,
        onChange,
        onBlur,
      })}

      {savingFieldId === campo.id && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--primary)' }}>
          Guardando...
        </div>
      )}

      {feedback ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color:
              feedback.tone === 'error'
                ? 'var(--danger)'
                : feedback.tone === 'warning'
                  ? '#92400e'
                  : 'var(--success)',
          }}
        >
          {feedback.message}
        </div>
      ) : aiMessageFieldId === campo.id ? (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--success)' }}>
          Sugerencia IA aplicada y guardada.
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

function renderField({
  campo,
  value,
  expandedText = false,
  onChange,
  onBlur,
}: {
  campo: CampoPostulacion
  value: DynamicFieldValue
  expandedText?: boolean
  onChange: (value: DynamicFieldValue) => void
  onBlur: () => void
}) {
  if (campo.tipo === 'texto_largo' || (campo.tipo === 'texto' && expandedText)) {
    return (
      <textarea
        value={fieldValueToString(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={{
          ...textareaStyle,
          minHeight: campo.tipo === 'texto_largo' ? 96 : 140,
        }}
        placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
      />
    )
  }

  if (campo.tipo === 'numero' || campo.tipo === 'plazo' || campo.tipo === 'presupuesto') {
    return (
      <input
        type="number"
        value={fieldValueToString(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={inputStyle}
        placeholder={getNumericPlaceholder(campo.tipo)}
        min="0"
        step="1"
      />
    )
  }

  if (campo.tipo === 'fecha') {
    return (
      <input
        type="date"
        value={fieldValueToString(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={inputStyle}
      />
    )
  }

  if (campo.tipo === 'booleano') {
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 42,
          fontSize: 14,
          color: 'var(--text)',
        }}
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => {
            onChange(e.target.checked)
            setTimeout(onBlur, 0)
          }}
        />
        Sí / No
      </label>
    )
  }

  return (
    <input
      type="text"
      value={fieldValueToString(value)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={inputStyle}
      placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
    />
  )
}

function defaultValueForType(tipo: string) {
  if (tipo === 'booleano') return false
  return ''
}

function getFieldAIAvailability(campo: CampoPostulacion, value: DynamicFieldValue) {
  const hasContent = fieldValueToString(value).trim().length > 0

  if (!['texto', 'texto_largo'].includes(campo.tipo)) {
    return {
      showButton: false,
      buttonLabel: '',
      message: '',
    }
  }

  if (campo.ai_mode === 'blocked') {
    return {
      showButton: false,
      buttonLabel: '',
      message: 'Campo sensible: completar manualmente.',
    }
  }

  if (campo.ai_mode === 'improve_only') {
    return {
      showButton: hasContent,
      buttonLabel: 'Mejorar con IA',
      message: hasContent
        ? 'La IA puede ayudarte a mejorar este texto.'
        : 'La mejora con IA se habilita cuando el campo ya tenga contenido.',
    }
  }

  if (campo.ai_mode === 'suggest') {
    return {
      showButton: true,
      buttonLabel: hasContent ? 'Mejorar con IA' : 'Completar con IA',
      message: 'Sugerencia IA disponible para este campo.',
    }
  }

  if (isSensitiveField(campo)) {
    return {
      showButton: false,
      buttonLabel: '',
      message: 'Campo sensible: completar manualmente.',
    }
  }

  return {
    showButton: true,
    buttonLabel: hasContent ? 'Mejorar con IA' : 'Completar con IA',
    message: 'Sugerencia IA disponible para este campo.',
  }
}

function isSensitiveField(campo: CampoPostulacion) {
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
}

function getFieldSection(tipo: string) {
  if (tipo === 'plazo') return 'plazo'
  if (tipo === 'presupuesto') return 'presupuesto'
  return 'descripcion'
}

function getNumericPlaceholder(tipo: string) {
  if (tipo === 'plazo') return 'Ingrese días...'
  if (tipo === 'presupuesto') return 'Ingrese monto...'
  return 'Ingrese número...'
}

function sumFieldValues(
  campos: CampoPostulacion[],
  values: Record<string, DynamicFieldValue>
) {
  return campos.reduce((total, campo) => total + dynamicValueToNumber(values[campo.id]), 0)
}

function dynamicValueToNumber(value: DynamicFieldValue) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
    return 0
  }

  const parsed = Number(String(value).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function fieldValueToString(value: DynamicFieldValue) {
  if (value === null || value === undefined || typeof value === 'boolean') return ''
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  borderRadius: 12,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  padding: '0 12px',
  fontSize: 14,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 96,
  borderRadius: 12,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
  resize: 'vertical',
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: '#f9fafb',
  padding: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 17,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

const fieldsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 6,
}

const descriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  lineHeight: 1.45,
  marginBottom: 6,
}

const groupTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: 'var(--primary-dark)',
}

const subgroupTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#4b5563',
}

const totalStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 14,
  border: '1px solid var(--primary-soft)',
  background: 'var(--primary-tint)',
  color: 'var(--primary-dark)',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 15,
  fontWeight: 800,
}

function aiButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 28,
    borderRadius: 999,
    border: '1px solid var(--primary-soft)',
    background: 'var(--primary-tint)',
    color: 'var(--primary-dark)',
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    flexShrink: 0,
  }
}

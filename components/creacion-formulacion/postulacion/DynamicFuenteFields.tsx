'use client'

import { useMemo, useState } from 'react'
import { guardarRespuestaDinamica } from '../../../app/creacion-formulacion/postulacion/dynamic-actions'
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
  const safeRespuestas = useMemo(
    () => (Array.isArray(respuestasIniciales) ? respuestasIniciales : []),
    [respuestasIniciales]
  )

  const camposActivos = useMemo(() => {
    if (!fuenteId) return []
    return campos
      .filter((c) => String(c.fuente_id) === String(fuenteId) && c.visible)
      .sort((a, b) => a.orden - b.orden)
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
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          padding: 16,
          color: '#1d4ed8',
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
          border: '1px solid #e5e7eb',
          padding: 16,
          color: '#6b7280',
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

    const result = await guardarRespuestaDinamica({
      proyectoId,
      fuenteId,
      campoId: campo.id,
      tipo: campo.tipo,
      valor: value,
    })

    setSavingFieldId(null)

    if (!result.success) {
      alert(result.error)
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 22,
        border: '1px solid #e5e7eb',
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 18,
          fontSize: 20,
          fontWeight: 700,
          color: '#111827',
        }}
      >
        Formulario de Postulación
      </h3>
      <div
        style={{
          marginTop: -12,
          marginBottom: 18,
          fontSize: 14,
          color: '#6b7280',
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
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
        />
        <FieldSection
          title="Plazos"
          campos={camposPlazo}
          values={values}
          savingFieldId={savingFieldId}
          emptyText="No hay campos de plazo configurados."
          totalLabel="Plazo total"
          totalValue={`${plazoTotal} días`}
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
        />
        <FieldSection
          title="Presupuesto"
          campos={camposPresupuesto}
          values={values}
          savingFieldId={savingFieldId}
          emptyText="No hay campos de presupuesto configurados."
          totalLabel="Presupuesto total"
          totalValue={`CLP ${new Intl.NumberFormat('es-CL').format(presupuestoTotal)}`}
          onChange={(campoId, newValue) =>
            setValues((prev) => ({ ...prev, [campoId]: newValue }))
          }
          onBlur={handleBlurSave}
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
  emptyText,
  totalLabel,
  totalValue,
  onChange,
  onBlur,
}: {
  title: string
  campos: CampoPostulacion[]
  values: Record<string, DynamicFieldValue>
  savingFieldId: string | null
  emptyText: string
  totalLabel?: string
  totalValue?: string
  onChange: (campoId: string, value: DynamicFieldValue) => void
  onBlur: (campo: CampoPostulacion, value: DynamicFieldValue) => void
}) {
  return (
    <section style={sectionStyle}>
      <h4 style={sectionTitleStyle}>{title}</h4>
      {campos.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>{emptyText}</div>
      ) : (
        <div style={fieldsGridStyle}>
          {campos.map((campo) => (
            <div
              key={campo.id}
              style={{
                gridColumn: campo.tipo === 'texto_largo' ? '1 / -1' : 'auto',
              }}
            >
              <label style={labelStyle}>
                {campo.nombre} {campo.obligatorio ? <span style={{ color: '#ef4444' }}>*</span> : null}
              </label>

              {renderField({
                campo,
                value: values[campo.id] ?? defaultValueForType(campo.tipo),
                onChange: (newValue) => onChange(campo.id, newValue),
                onBlur: () => onBlur(campo, values[campo.id]),
              })}

              {savingFieldId === campo.id && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#2563eb' }}>
                  Guardando...
                </div>
              )}
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

function renderField({
  campo,
  value,
  onChange,
  onBlur,
}: {
  campo: CampoPostulacion
  value: DynamicFieldValue
  onChange: (value: DynamicFieldValue) => void
  onBlur: () => void
}) {
  if (campo.tipo === 'texto_largo') {
    return (
      <textarea
        value={fieldValueToString(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={textareaStyle}
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
          color: '#374151',
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  padding: '0 12px',
  fontSize: 14,
  color: '#111827',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 96,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  padding: '10px 12px',
  fontSize: 14,
  color: '#111827',
  boxSizing: 'border-box',
  resize: 'vertical',
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 17,
  fontWeight: 800,
  color: '#111827',
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
  color: '#374151',
  marginBottom: 6,
}

const totalStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 14,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '14px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 15,
  fontWeight: 800,
}

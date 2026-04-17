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
  campos,
  respuestasIniciales,
}: {
  proyectoId: string
  fuenteId: string | null
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
      .filter((c) => c.fuente_id === fuenteId && c.visible)
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
        Esta fuente aún no tiene campos dinámicos configurados.
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
        Formulario Dinámico según Fuente
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {camposActivos.map((campo) => (
          <div
            key={campo.id}
            style={{
              gridColumn: campo.tipo === 'texto_largo' ? '1 / -1' : 'auto',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#374151',
                marginBottom: 6,
              }}
            >
              {campo.nombre} {campo.obligatorio ? <span style={{ color: '#ef4444' }}>*</span> : null}
            </label>

            {renderField({
              campo,
              value: values[campo.id] ?? defaultValueForType(campo.tipo),
              onChange: (newValue) =>
                setValues((prev) => ({ ...prev, [campo.id]: newValue })),
              onBlur: () => handleBlurSave(campo, values[campo.id]),
            })}

            {savingFieldId === campo.id && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#2563eb',
                }}
              >
                Guardando...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
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

  if (campo.tipo === 'numero') {
    return (
      <input
        type="number"
        value={fieldValueToString(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        style={inputStyle}
        placeholder={`Ingrese ${campo.nombre.toLowerCase()}...`}
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

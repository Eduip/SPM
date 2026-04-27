'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarUnidad,
  crearUnidad,
  eliminarUnidad,
} from '../../../app/administracion/unidades/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'

type Unidad = {
  id: string
  nombre: string
  codigo: string | null
  descripcion: string | null
  activo: boolean | null
}

type FormState = {
  nombre: string
  codigo: string
  descripcion: string
  activo: boolean
}

const emptyForm: FormState = {
  nombre: '',
  codigo: '',
  descripcion: '',
  activo: true,
}

function toFormState(unidad: Unidad | null): FormState {
  if (!unidad) return emptyForm

  return {
    nombre: unidad.nombre ?? '',
    codigo: unidad.codigo ?? '',
    descripcion: unidad.descripcion ?? '',
    activo: Boolean(unidad.activo),
  }
}

export default function UnidadesPage({
  unidades,
  error,
}: {
  unidades: Unidad[]
  error: string | null
}) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(unidades[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectedUnidad = useMemo(
    () => unidades.find((u) => u.id === selectedId) ?? unidades[0] ?? null,
    [unidades, selectedId]
  )

  const [form, setForm] = useState<FormState>(() => toFormState(selectedUnidad))

  const handleExport = () => {
    exportRowsToCsv(
      'unidades-municipales.csv',
      unidades.map((unidad) => ({
        nombre: unidad.nombre,
        codigo: unidad.codigo ?? '',
        activo: unidad.activo ? 'Activa' : 'Inactiva',
        descripcion: unidad.descripcion ?? '',
      }))
    )
  }

  const handleSelect = (unidad: Unidad) => {
    setSelectedId(unidad.id)
    setForm(toFormState(unidad))
  }

  const handleSave = async () => {
    if (!selectedUnidad) return

    setSaving(true)

    const res = await actualizarUnidad({
      id: selectedUnidad.id,
      nombre: form.nombre,
      codigo: form.codigo,
      descripcion: form.descripcion,
      activo: form.activo,
    })

    setSaving(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  const handleDelete = async () => {
    if (!selectedUnidad) return

    const confirmed = window.confirm(
      `¿Eliminar la unidad ${selectedUnidad.nombre || 'seleccionada'}?`
    )

    if (!confirmed) return

    setDeleting(true)

    const res = await eliminarUnidad(selectedUnidad.id)

    setDeleting(false)

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
            Administración &gt; Unidades Municipales
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text-strong)',
            }}
          >
            Unidades Municipales
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Gestión centralizada de unidades responsables del sistema
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleExport} style={secondaryButtonStyle}>
            Exportar
          </button>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            style={darkButtonStyle}
          >
            + Nueva Unidad
          </button>
        </div>
      </div>

      {error && <div style={errorCardStyle}>Error al cargar unidades: {error}</div>}

      {showNewForm && (
        <form
          action={async (formData) => {
            const res = await crearUnidad(formData)

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
            placeholder="Nombre de la unidad"
            required
            style={inputStyle}
          />

          <input
            name="codigo"
            placeholder="Código"
            style={inputStyle}
          />

          <input
            name="descripcion"
            placeholder="Descripción"
            style={inputStyle}
          />

          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activa
          </label>

          <button type="submit" style={saveButtonStyle}>
            Guardar unidad
          </button>
        </form>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={leftPanelStyle}>
          <div style={sectionTitleStyle}>🏢 Unidades Disponibles</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unidades.map((unidad) => {
              const active = unidad.id === selectedUnidad?.id

              return (
                <button
                  key={unidad.id}
                  onClick={() => handleSelect(unidad)}
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
                    {unidad.nombre}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 8,
                      textAlign: 'left',
                    }}
                  >
                    {unidad.codigo || 'Sin código'}
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
                    {unidad.descripcion || 'Sin descripción'}
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
                        background: unidad.activo ? '#dcfce7' : '#fee2e2',
                        color: unidad.activo ? '#16a34a' : '#dc2626',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {unidad.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>⚙️ Configuración de la Unidad</div>

            <div style={twoColsStyle}>
              <Field
                label="Nombre de la unidad"
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
                placeholder="Describe la función de esta unidad..."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <ToggleItem
                title="Unidad activa"
                subtitle="Disponible para asignación en proyectos"
                checked={form.activo}
                onChange={(v) => setForm((s) => ({ ...s, activo: v }))}
              />
            </div>
          </div>

          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>📌 Resumen de Uso</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <MiniMetric title="Proyectos" value="0" subtitle="asociados" />
              <MiniMetric title="Responsables" value="0" subtitle="asignados" />
              <MiniMetric title="Estado" value={form.activo ? 'Activa' : 'Inactiva'} subtitle="actual" />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedUnidad || deleting}
              style={dangerButtonStyle}
            >
              {deleting ? 'Eliminando...' : 'Eliminar unidad'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={!selectedUnidad || saving}
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

function MiniMetric({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        padding: 14,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
        {subtitle}
      </div>
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

const toggleItemStyle: React.CSSProperties = {
  borderRadius: 12,
  background: '#ffffff',
  border: '1px solid #f3f4f6',
  padding: 10,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

const dangerButtonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fff1f2',
  color: '#be123c',
  fontWeight: 700,
  cursor: 'pointer',
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

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarEstadoSistema,
  crearEstadoSistema,
  eliminarEstadoSistema,
} from '../../../app/administracion/estados/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'

type Estado = {
  id: string
  nombre: string
  codigo: string | null
  categoria: string
  color: string | null
  descripcion: string | null
  activo: boolean | null
}

type FormState = {
  nombre: string
  codigo: string
  categoria: string
  color: string
  descripcion: string
  activo: boolean
}

const categorias = ['proyecto', 'formulacion', 'rendicion', 'ejecucion', 'alerta']

const emptyForm: FormState = {
  nombre: '',
  codigo: '',
  categoria: 'proyecto',
  color: '#2563eb',
  descripcion: '',
  activo: true,
}

function toFormState(estado: Estado | null): FormState {
  if (!estado) return emptyForm

  return {
    nombre: estado.nombre ?? '',
    codigo: estado.codigo ?? '',
    categoria: estado.categoria ?? 'proyecto',
    color: estado.color ?? '#2563eb',
    descripcion: estado.descripcion ?? '',
    activo: Boolean(estado.activo),
  }
}

export default function EstadosSistemaPage({
  estados,
  error,
}: {
  estados: Estado[]
  error: string | null
}) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(estados[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectedEstado = useMemo(
    () => estados.find((e) => e.id === selectedId) ?? estados[0] ?? null,
    [estados, selectedId]
  )

  const [form, setForm] = useState<FormState>(() => toFormState(selectedEstado))

  const handleExport = () => {
    exportRowsToCsv(
      'estados-sistema.csv',
      estados.map((estado) => ({
        nombre: estado.nombre,
        codigo: estado.codigo ?? '',
        categoria: estado.categoria,
        color: estado.color ?? '',
        activo: estado.activo ? 'Activo' : 'Inactivo',
        descripcion: estado.descripcion ?? '',
      }))
    )
  }

  const handleSelect = (estado: Estado) => {
    setSelectedId(estado.id)
    setForm(toFormState(estado))
  }

  const handleSave = async () => {
    if (!selectedEstado) return

    setSaving(true)

    const res = await actualizarEstadoSistema({
      id: selectedEstado.id,
      nombre: form.nombre,
      codigo: form.codigo,
      categoria: form.categoria,
      color: form.color,
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
    if (!selectedEstado) return

    const confirmed = window.confirm(
      `¿Eliminar el estado ${selectedEstado.nombre || 'seleccionado'}?`
    )

    if (!confirmed) return

    setDeleting(true)

    const res = await eliminarEstadoSistema(selectedEstado.id)

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
            Administración &gt; Estados del Sistema
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Estados del Sistema
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Gestión centralizada de estados reutilizables para el sistema
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
            + Nuevo Estado
          </button>
        </div>
      </div>

      {error && <div style={errorCardStyle}>Error al cargar estados: {error}</div>}

      {showNewForm && (
        <form
          action={async (formData) => {
            const res = await crearEstadoSistema(formData)

            if (!res.success) {
              alert(res.error)
              return
            }

            setShowNewForm(false)
            router.refresh()
          }}
          style={topNewFormStyle}
        >
          <input name="nombre" placeholder="Nombre del estado" required style={inputStyle} />
          <input name="codigo" placeholder="Código" style={inputStyle} />
          <select name="categoria" defaultValue="proyecto" style={inputStyle}>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input name="color" type="color" defaultValue="#2563eb" style={colorInputStyle} />
          <input name="descripcion" placeholder="Descripción" style={inputStyle} />

          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activo
          </label>

          <button type="submit" style={saveButtonStyle}>
            Guardar estado
          </button>
        </form>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={leftPanelStyle}>
          <div style={sectionTitleStyle}>🔗 Estados Disponibles</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {estados.map((estado) => {
              const active = estado.id === selectedEstado?.id

              return (
                <button
                  key={estado.id}
                  onClick={() => handleSelect(estado)}
                  style={{
                    ...leftCardStyle,
                    border: active ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: active ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: '#111827',
                        textAlign: 'left',
                      }}
                    >
                      {estado.nombre}
                    </div>

                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: estado.color || '#2563eb',
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 6,
                      textAlign: 'left',
                    }}
                  >
                    {estado.codigo || 'Sin código'} • {estado.categoria}
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
                    {estado.descripcion || 'Sin descripción'}
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 999,
                      background: estado.activo ? '#dcfce7' : '#fee2e2',
                      color: estado.activo ? '#16a34a' : '#dc2626',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {estado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>⚙️ Configuración del Estado</div>

            <div style={twoColsStyle}>
              <Field
                label="Nombre del estado"
                value={form.nombre}
                onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
              />
              <Field
                label="Código"
                value={form.codigo}
                onChange={(v) => setForm((s) => ({ ...s, codigo: v }))}
              />
              <SelectField
                label="Categoría"
                value={form.categoria}
                onChange={(v) => setForm((s) => ({ ...s, categoria: v }))}
                options={categorias}
              />
              <ColorField
                label="Color"
                value={form.color}
                onChange={(v) => setForm((s) => ({ ...s, color: v }))}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <TextAreaField
                label="Descripción"
                value={form.descripcion}
                onChange={(v) => setForm((s) => ({ ...s, descripcion: v }))}
                placeholder="Describe el uso de este estado..."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <ToggleItem
                title="Estado activo"
                subtitle="Disponible para ser usado en el sistema"
                checked={form.activo}
                onChange={(v) => setForm((s) => ({ ...s, activo: v }))}
              />
            </div>
          </div>

          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>👁️ Vista Previa</div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 999,
                  background: `${form.color}22`,
                  color: form.color,
                  fontSize: 13,
                  fontWeight: 700,
                  border: `1px solid ${form.color}44`,
                }}
              >
                {form.nombre || 'Estado'}
              </span>

              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Categoría: {form.categoria}
              </span>
            </div>
          </div>

          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>📊 Resumen</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <MiniMetric title="Categoría" value={form.categoria} subtitle="tipo" />
              <MiniMetric title="Código" value={form.codigo || '-'} subtitle="identificador" />
              <MiniMetric title="Estado" value={form.activo ? 'Activo' : 'Inactivo'} subtitle="actual" />
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
              disabled={!selectedEstado || deleting}
              style={dangerButtonStyle}
            >
              {deleting ? 'Eliminando...' : 'Eliminar estado'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={!selectedEstado || saving}
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
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
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={colorInputStyle} />
        <input value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      </div>
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
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{value}</div>
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

const colorInputStyle: React.CSSProperties = {
  width: 54,
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 4,
  boxSizing: 'border-box',
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
  background: '#111827',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
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

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  actualizarUsuarioPerfil,
  crearUsuarioPerfil,
  eliminarUsuarioPerfil,
} from '../../../app/administracion/usuarios/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'

type Rol = {
  id: string
  nombre: string
  codigo: string | null
}

type Unidad = {
  id: string
  nombre: string
  codigo: string | null
}

type Usuario = {
  id: string
  nombre_completo: string | null
  email: string | null
  rol_id: string | null
  unidad_id: string | null
  activo: boolean | null
  rol?: Rol | Rol[] | null
  unidad?: Unidad | Unidad[] | null
}

type FormState = {
  nombre_completo: string
  email: string
  rol_id: string
  unidad_id: string
  activo: boolean
}

const emptyForm: FormState = {
  nombre_completo: '',
  email: '',
  rol_id: '',
  unidad_id: '',
  activo: true,
}

function toFormState(usuario: Usuario | null): FormState {
  if (!usuario) return emptyForm

  return {
    nombre_completo: usuario.nombre_completo ?? '',
    email: usuario.email ?? '',
    rol_id: usuario.rol_id ?? '',
    unidad_id: usuario.unidad_id ?? '',
    activo: Boolean(usuario.activo),
  }
}

function getSingleRef<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default function UsuariosPage({
  usuarios,
  roles,
  unidades,
  error,
}: {
  usuarios: Usuario[]
  roles: Rol[]
  unidades: Unidad[]
  error: string | null
}) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(usuarios[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectedUsuario = useMemo(
    () => usuarios.find((u) => u.id === selectedId) ?? usuarios[0] ?? null,
    [usuarios, selectedId]
  )

  const [form, setForm] = useState<FormState>(() => toFormState(selectedUsuario))

  const handleExport = () => {
    exportRowsToCsv(
      'usuarios.csv',
      usuarios.map((usuario) => ({
        nombre: usuario.nombre_completo ?? '',
        email: usuario.email ?? '',
        rol: getSingleRef(usuario.rol)?.nombre ?? '',
        unidad: getSingleRef(usuario.unidad)?.nombre ?? '',
        activo: usuario.activo ? 'Activo' : 'Inactivo',
      }))
    )
  }

  const handleSelect = (usuario: Usuario) => {
    setSelectedId(usuario.id)
    setForm(toFormState(usuario))
  }

  const handleSave = async () => {
    if (!selectedUsuario) return

    setSaving(true)

    const res = await actualizarUsuarioPerfil({
      id: selectedUsuario.id,
      nombre_completo: form.nombre_completo,
      email: form.email,
      rol_id: form.rol_id,
      unidad_id: form.unidad_id,
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
    if (!selectedUsuario) return

    const confirmed = window.confirm(
      `¿Eliminar el usuario ${selectedUsuario.nombre_completo || selectedUsuario.email || 'seleccionado'}?`
    )

    if (!confirmed) return

    setDeleting(true)

    const res = await eliminarUsuarioPerfil(selectedUsuario.id)

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
            Administración &gt; Creación de Usuarios
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: '#111827',
            }}
          >
            Creación de Usuarios
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Gestión centralizada de usuarios, roles y unidades responsables
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
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {error && <div style={errorCardStyle}>Error al cargar usuarios: {error}</div>}

      {showNewForm && (
        <form
          action={async (formData) => {
            const res = await crearUsuarioPerfil(formData)

            if (!res.success) {
              alert(res.error)
              return
            }
            
            alert(`Usuario creado correctamente.\nContraseña temporal: ${res.tempPassword}`)
            
            setShowNewForm(false)
            router.refresh()
          }}
          style={topNewFormStyle}
        >
          <input
            name="nombre_completo"
            placeholder="Nombre completo"
            required
            style={inputStyle}
          />

          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            required
            style={inputStyle}
          />

          <select name="rol_id" defaultValue="" style={inputStyle}>
            <option value="">Sin rol asignado</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>

          <select name="unidad_id" defaultValue="" style={inputStyle}>
            <option value="">Sin unidad asignada</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre}
              </option>
            ))}
          </select>

          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activo
          </label>

          <button type="submit" style={saveButtonStyle}>
            Guardar usuario
          </button>
        </form>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={leftPanelStyle}>
          <div style={sectionTitleStyle}>👤 Usuarios Disponibles</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {usuarios.map((usuario) => {
              const active = usuario.id === selectedUsuario?.id
              const rol = Array.isArray(usuario.rol) ? usuario.rol[0] : usuario.rol
              const unidad = Array.isArray(usuario.unidad) ? usuario.unidad[0] : usuario.unidad

              return (
                <button
                  key={usuario.id}
                  onClick={() => handleSelect(usuario)}
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
                    {usuario.nombre_completo || 'Sin nombre'}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 6,
                      textAlign: 'left',
                    }}
                  >
                    {usuario.email || 'Sin email'}
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
                    {(rol?.nombre || 'Sin rol')} • {(unidad?.nombre || 'Sin unidad')}
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 999,
                      background: usuario.activo ? '#dcfce7' : '#fee2e2',
                      color: usuario.activo ? '#16a34a' : '#dc2626',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>⚙️ Configuración del Usuario</div>

            {!selectedUsuario ? (
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                No hay usuarios disponibles.
              </div>
            ) : (
              <>
                <div style={twoColsStyle}>
                  <Field
                    label="Nombre completo"
                    value={form.nombre_completo}
                    onChange={(v) => setForm((s) => ({ ...s, nombre_completo: v }))}
                  />

                  <Field
                    label="Correo electrónico"
                    value={form.email}
                    onChange={(v) => setForm((s) => ({ ...s, email: v }))}
                  />

                  <SelectField
                    label="Rol"
                    value={form.rol_id}
                    onChange={(v) => setForm((s) => ({ ...s, rol_id: v }))}
                    options={[
                      { value: '', label: 'Sin rol asignado' },
                      ...roles.map((rol) => ({
                        value: rol.id,
                        label: rol.nombre,
                      })),
                    ]}
                  />

                  <SelectField
                    label="Unidad"
                    value={form.unidad_id}
                    onChange={(v) => setForm((s) => ({ ...s, unidad_id: v }))}
                    options={[
                      { value: '', label: 'Sin unidad asignada' },
                      ...unidades.map((unidad) => ({
                        value: unidad.id,
                        label: unidad.nombre,
                      })),
                    ]}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <ToggleItem
                    title="Usuario activo"
                    subtitle="Disponible para operar en el sistema"
                    checked={form.activo}
                    onChange={(v) => setForm((s) => ({ ...s, activo: v }))}
                  />
                </div>
              </>
            )}
          </div>

          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>📊 Resumen</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <MiniMetric
                title="Rol"
                value={
                  roles.find((r) => r.id === form.rol_id)?.nombre || 'Sin rol'
                }
                subtitle="asignado"
              />
              <MiniMetric
                title="Unidad"
                value={
                  unidades.find((u) => u.id === form.unidad_id)?.nombre || 'Sin unidad'
                }
                subtitle="responsable"
              />
              <MiniMetric
                title="Estado"
                value={form.activo ? 'Activo' : 'Inactivo'}
                subtitle="actual"
              />
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
              disabled={!selectedUsuario || deleting}
              style={dangerButtonStyle}
            >
              {deleting ? 'Eliminando...' : 'Eliminar usuario'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={!selectedUsuario || saving}
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
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
  options: { value: string; label: string }[]
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
          <option key={`${opt.value}-${opt.label}`} value={opt.value}>
            {opt.label}
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

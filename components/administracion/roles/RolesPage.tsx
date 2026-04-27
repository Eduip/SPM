'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  crearPermiso,
  crearRol,
  eliminarPermiso,
  eliminarRol,
  sincronizarPermisosBase,
  togglePermisoRol,
} from '../../../app/administracion/roles/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'

type Rol = {
  id: string
  nombre: string
  codigo: string | null
  descripcion: string | null
  activo: boolean | null
}

type Permiso = {
  id: string
  nombre: string
  codigo: string | null
  modulo: string | null
  descripcion: string | null
}

type Relacion = {
  id: string
  rol_id: string
  permiso_id: string
}

export default function RolesPage({
  roles,
  permisos,
  relaciones,
  error,
}: {
  roles: Rol[]
  permisos: Permiso[]
  relaciones: Relacion[]
  error: string | null
}) {
  const router = useRouter()
  const [selectedRolId, setSelectedRolId] = useState<string | null>(roles[0]?.id ?? null)
  const [savingPermisoId, setSavingPermisoId] = useState<string | null>(null)
  const [showNewRoleForm, setShowNewRoleForm] = useState(false)
  const [showNewPermissionForm, setShowNewPermissionForm] = useState(false)
  const [deletingRol, setDeletingRol] = useState(false)
  const [deletingPermisoId, setDeletingPermisoId] = useState<string | null>(null)
  const [syncingPermissions, setSyncingPermissions] = useState(false)

  const selectedRol = useMemo(
    () => roles.find((r) => r.id === selectedRolId) ?? roles[0] ?? null,
    [roles, selectedRolId]
  )

  const permisosPorModulo = useMemo(() => {
    const map: Record<string, Permiso[]> = {}

    permisos.forEach((permiso) => {
      const modulo = permiso.modulo || 'general'
      if (!map[modulo]) map[modulo] = []
      map[modulo].push(permiso)
    })

    return map
  }, [permisos])

  const tienePermiso = (permisoId: string) => {
    return relaciones.some(
      (rel) => rel.rol_id === selectedRolId && rel.permiso_id === permisoId
    )
  }

  const handleExport = () => {
    exportRowsToCsv(
      'roles-permisos.csv',
      roles.flatMap((rol) =>
        permisos.map((permiso) => ({
          rol: rol.nombre,
          rol_codigo: rol.codigo ?? '',
          permiso: permiso.nombre,
          permiso_codigo: permiso.codigo ?? '',
          modulo: permiso.modulo ?? '',
          asignado: relaciones.some(
            (rel) => rel.rol_id === rol.id && rel.permiso_id === permiso.id
          )
            ? 'Sí'
            : 'No',
        }))
      )
    )
  }

  const handleToggle = async (permisoId: string) => {
    if (!selectedRolId) return

    const activoActual = tienePermiso(permisoId)
    setSavingPermisoId(permisoId)

    const res = await togglePermisoRol({
      rolId: selectedRolId,
      permisoId,
      activo: !activoActual,
    })

    setSavingPermisoId(null)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  const handleDeleteRol = async () => {
    if (!selectedRol) return

    const confirmed = window.confirm(`¿Eliminar el rol ${selectedRol.nombre}?`)
    if (!confirmed) return

    setDeletingRol(true)

    const res = await eliminarRol(selectedRol.id)

    setDeletingRol(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    setSelectedRolId(null)
    router.refresh()
  }

  const handleDeletePermiso = async (permiso: Permiso) => {
    const confirmed = window.confirm(`¿Eliminar el permiso ${permiso.nombre}?`)
    if (!confirmed) return

    setDeletingPermisoId(permiso.id)

    const res = await eliminarPermiso(permiso.id)

    setDeletingPermisoId(null)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  const handleSyncPermissions = async () => {
    setSyncingPermissions(true)

    const res = await sincronizarPermisosBase()

    setSyncingPermissions(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    alert(
      res.inserted > 0
        ? `Se agregaron ${res.inserted} permisos base.`
        : 'Los permisos base ya estaban actualizados.'
    )
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
            Administración &gt; Roles y Permisos
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text-strong)',
            }}
          >
            Roles y Permisos
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            Configuración de accesos por rol para cada módulo del sistema
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleExport} style={secondaryButtonStyle}>
            Exportar
          </button>
          <button
            type="button"
            onClick={handleSyncPermissions}
            disabled={syncingPermissions}
            style={{
              ...secondaryButtonStyle,
              opacity: syncingPermissions ? 0.7 : 1,
              cursor: syncingPermissions ? 'not-allowed' : 'pointer',
            }}
          >
            {syncingPermissions ? 'Sincronizando...' : 'Sincronizar Permisos'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewPermissionForm((value) => !value)}
            style={secondaryButtonStyle}
          >
            + Nuevo Permiso
          </button>
          <button
            type="button"
            onClick={() => setShowNewRoleForm((value) => !value)}
            style={darkButtonStyle}
          >
            + Nuevo Rol
          </button>
        </div>
      </div>

      {error && <div style={errorCardStyle}>Error al cargar roles/permisos: {error}</div>}

      {showNewRoleForm && (
        <form
          action={async (formData) => {
            const res = await crearRol(formData)

            if (!res.success) {
              alert(res.error)
              return
            }

            setShowNewRoleForm(false)
            router.refresh()
          }}
          style={topFormStyle}
        >
          <input name="nombre" placeholder="Nombre del rol" required style={inputStyle} />
          <input name="codigo" placeholder="Código" style={inputStyle} />
          <input name="descripcion" placeholder="Descripción" style={inputStyle} />
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activo
          </label>
          <button type="submit" style={saveButtonStyle}>
            Guardar rol
          </button>
        </form>
      )}

      {showNewPermissionForm && (
        <form
          action={async (formData) => {
            const res = await crearPermiso(formData)

            if (!res.success) {
              alert(res.error)
              return
            }

            setShowNewPermissionForm(false)
            router.refresh()
          }}
          style={topFormStyle}
        >
          <input name="nombre" placeholder="Nombre del permiso" required style={inputStyle} />
          <input name="codigo" placeholder="Código" style={inputStyle} />
          <input name="modulo" placeholder="Módulo" style={inputStyle} />
          <input name="descripcion" placeholder="Descripción" style={inputStyle} />
          <button type="submit" style={saveButtonStyle}>
            Guardar permiso
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
        {/* Panel izquierdo */}
        <div style={leftPanelStyle}>
          <div style={sectionTitleStyle}>🛡️ Roles Disponibles</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roles.map((rol) => {
              const active = rol.id === selectedRol?.id

              return (
                <button
                  key={rol.id}
                  onClick={() => setSelectedRolId(rol.id)}
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
                    {rol.nombre}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 8,
                      textAlign: 'left',
                    }}
                  >
                    {rol.codigo || 'Sin código'}
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
                    {rol.descripcion || 'Sin descripción'}
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 999,
                      background: rol.activo ? '#dcfce7' : '#fee2e2',
                      color: rol.activo ? '#16a34a' : '#dc2626',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {rol.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={panelCardStyle}>
            <div
              style={{
                ...panelHeaderStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>⚙️ Configuración del Rol</span>
              <button
                type="button"
                onClick={handleDeleteRol}
                disabled={!selectedRol || deletingRol}
                style={!selectedRol ? disabledDangerButtonStyle : dangerButtonStyle}
              >
                {deletingRol ? 'Eliminando...' : 'Eliminar rol'}
              </button>
            </div>

            {!selectedRol ? (
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                No hay roles disponibles.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <MiniMetric title="Rol" value={selectedRol.nombre} subtitle="seleccionado" />
                <MiniMetric title="Código" value={selectedRol.codigo || '-'} subtitle="identificador" />
                <MiniMetric title="Estado" value={selectedRol.activo ? 'Activo' : 'Inactivo'} subtitle="actual" />
              </div>
            )}
          </div>

          {Object.entries(permisosPorModulo).map(([modulo, perms]) => (
            <div key={modulo} style={panelCardStyle}>
              <div
                style={{
                  ...panelHeaderStyle,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>📁 {humanize(modulo)}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    fontWeight: 600,
                  }}
                >
                  {perms.length} permiso(s)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {perms.map((permiso) => {
                  const checked = tienePermiso(permiso.id)
                  const loading = savingPermisoId === permiso.id

                  return (
                    <div key={permiso.id} style={permissionRowStyle}>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-strong)',
                            marginBottom: 4,
                          }}
                        >
                          {permiso.nombre}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            lineHeight: 1.5,
                          }}
                        >
                          {permiso.descripcion || permiso.codigo || 'Sin descripción'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          disabled={!selectedRolId || loading}
                          onClick={() => handleToggle(permiso.id)}
                          style={{
                            width: 42,
                            height: 24,
                            borderRadius: 999,
                            border: 'none',
                            background: checked ? '#2563eb' : '#e5e7eb',
                            position: 'relative',
                            cursor: 'pointer',
                            flexShrink: 0,
                            opacity: loading ? 0.7 : 1,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: 3,
                              left: checked ? 21 : 3,
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              background: '#ffffff',
                              transition: 'all .2s ease',
                            }}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePermiso(permiso)}
                          disabled={deletingPermisoId === permiso.id}
                          style={miniDangerButtonStyle}
                        >
                          {deletingPermisoId === permiso.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
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
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)' }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  )
}

function humanize(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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

const topFormStyle: React.CSSProperties = {
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

const inputStyle: React.CSSProperties = {
  width: 220,
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '0 12px',
  fontSize: 13,
  color: 'var(--text-strong)',
  boxSizing: 'border-box',
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  color: '#374151',
}

const permissionRowStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
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

const dangerButtonStyle: React.CSSProperties = {
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

const disabledDangerButtonStyle: React.CSSProperties = {
  ...dangerButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed',
}

const miniDangerButtonStyle: React.CSSProperties = {
  ...dangerButtonStyle,
  height: 28,
}

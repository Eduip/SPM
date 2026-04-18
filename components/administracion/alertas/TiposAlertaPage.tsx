'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  activarTodasAlertas,
  actualizarTipoAlerta,
  crearTipoAlerta,
  eliminarTipoAlerta,
} from '../../../app/administracion/alertas/actions'
import { exportRowsToCsv } from '../../../lib/export-csv'

type TipoAlerta = {
  id: string
  nombre: string
  codigo: string | null
  modulo: string
  severidad: string
  color: string | null
  descripcion: string | null
  activo: boolean | null
}

type FormState = {
  nombre: string
  codigo: string
  modulo: string
  severidad: string
  condicion: string
  activo: boolean
}

const modulos = ['general', 'garantias', 'rendicion', 'ejecucion', 'financiamiento', 'pagos', 'proyectos']
const prioridades = ['informativa', 'media', 'alta', 'critica']

const emptyForm: FormState = {
  nombre: '',
  codigo: '',
  modulo: 'general',
  severidad: 'media',
  condicion: '',
  activo: true,
}

function toFormState(alerta: TipoAlerta | null): FormState {
  if (!alerta) return emptyForm

  return {
    nombre: alerta.nombre ?? '',
    codigo: alerta.codigo ?? '',
    modulo: alerta.modulo ?? 'general',
    severidad: normalizePriority(alerta.severidad),
    condicion: alerta.descripcion ?? '',
    activo: Boolean(alerta.activo),
  }
}

export default function TiposAlertaPage({
  alertas,
  error,
}: {
  alertas: TipoAlerta[]
  error: string | null
}) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(alertas[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activatingAll, setActivatingAll] = useState(false)
  const [moduleFilter, setModuleFilter] = useState('todos')
  const [priorityFilter, setPriorityFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('todos')

  const selectedAlerta = useMemo(
    () => alertas.find((a) => a.id === selectedId) ?? alertas[0] ?? null,
    [alertas, selectedId]
  )

  const [form, setForm] = useState<FormState>(() => toFormState(selectedAlerta))

  const filteredAlertas = useMemo(() => {
    return alertas.filter((alerta) => {
      const priority = normalizePriority(alerta.severidad)
      const matchModule = moduleFilter === 'todos' || alerta.modulo === moduleFilter
      const matchPriority = priorityFilter === 'todas' || priority === priorityFilter
      const matchStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activas' && alerta.activo) ||
        (statusFilter === 'inactivas' && !alerta.activo)

      return matchModule && matchPriority && matchStatus
    })
  }, [alertas, moduleFilter, priorityFilter, statusFilter])

  const availableModules = useMemo(() => {
    return Array.from(new Set([...modulos, ...alertas.map((alerta) => alerta.modulo).filter(Boolean)]))
  }, [alertas])

  const handleSelect = (alerta: TipoAlerta) => {
    setSelectedId(alerta.id)
    setForm(toFormState(alerta))
  }

  const handleExport = () => {
    exportRowsToCsv(
      'reglas-alerta.csv',
      alertas.map((alerta) => ({
        nombre: alerta.nombre,
        codigo: alerta.codigo ?? '',
        modulo: alerta.modulo,
        condicion: alerta.descripcion ?? '',
        prioridad: humanize(normalizePriority(alerta.severidad)),
        estado: alerta.activo ? 'Activa' : 'Inactiva',
      }))
    )
  }

  const handleSave = async () => {
    if (!selectedAlerta) return

    setSaving(true)

    const res = await actualizarTipoAlerta({
      id: selectedAlerta.id,
      nombre: form.nombre,
      codigo: form.codigo,
      modulo: form.modulo,
      severidad: form.severidad,
      descripcion: form.condicion,
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
    if (!selectedAlerta) return

    const confirmed = window.confirm(`¿Eliminar la regla ${selectedAlerta.nombre}?`)
    if (!confirmed) return

    setDeleting(true)
    const res = await eliminarTipoAlerta(selectedAlerta.id)
    setDeleting(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    setSelectedId(null)
    router.refresh()
  }

  const handleActivateAll = async () => {
    setActivatingAll(true)
    const res = await activarTodasAlertas()
    setActivatingAll(false)

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  const handleToggleActive = async (alerta: TipoAlerta) => {
    const res = await actualizarTipoAlerta({
      id: alerta.id,
      nombre: alerta.nombre,
      codigo: alerta.codigo ?? '',
      modulo: alerta.modulo,
      severidad: normalizePriority(alerta.severidad),
      descripcion: alerta.descripcion ?? '',
      activo: !alerta.activo,
    })

    if (!res.success) {
      alert(res.error)
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={headerStyle}>
        <div>
          <div style={breadcrumbStyle}>Administración &gt; Tipos de Alertas</div>
          <h1 style={titleStyle}>Tipos de Alertas</h1>
          <div style={subtitleStyle}>
            Configure reglas automáticas para detectar eventos críticos en los proyectos.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleExport} style={secondaryButtonStyle}>
            Exportar configuración
          </button>
          <button
            type="button"
            onClick={handleActivateAll}
            disabled={activatingAll}
            style={secondaryButtonStyle}
          >
            {activatingAll ? 'Activando...' : 'Activar todas'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewForm((value) => !value)}
            style={darkButtonStyle}
          >
            + Nueva regla de alerta
          </button>
        </div>
      </div>

      {error && <div style={errorCardStyle}>Error al cargar reglas de alerta: {error}</div>}

      {showNewForm && (
        <form
          action={async (formData) => {
            const res = await crearTipoAlerta(formData)

            if (!res.success) {
              alert(res.error)
              return
            }

            setShowNewForm(false)
            router.refresh()
          }}
          style={topNewFormStyle}
        >
          <input name="nombre" placeholder="Nombre de la regla" required style={inputStyle} />
          <input name="codigo" placeholder="Código automático si queda vacío" style={inputStyle} />
          <select name="modulo" defaultValue="general" style={inputStyle}>
            {availableModules.map((modulo) => (
              <option key={modulo} value={modulo}>
                {humanize(modulo)}
              </option>
            ))}
          </select>
          <select name="severidad" defaultValue="media" style={inputStyle}>
            {prioridades.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {humanize(prioridad)}
              </option>
            ))}
          </select>
          <input
            name="condicion"
            placeholder="Condición, por ejemplo: Días sin rendición > 60"
            required
            style={{ ...inputStyle, minWidth: 300 }}
          />
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="activo" defaultChecked />
            Activa
          </label>
          <button type="submit" style={saveButtonStyle}>
            Guardar regla
          </button>
        </form>
      )}

      <div style={filtersStyle}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Filtros:</span>
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={filterSelectStyle}>
          <option value="todos">Todos los módulos</option>
          {availableModules.map((modulo) => (
            <option key={modulo} value={modulo}>
              {humanize(modulo)}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} style={filterSelectStyle}>
          <option value="todas">Todas las prioridades</option>
          {prioridades.map((prioridad) => (
            <option key={prioridad} value={prioridad}>
              {humanize(prioridad)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={filterSelectStyle}>
          <option value="todos">Todas</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </div>

      <div style={layoutStyle}>
        <aside style={leftPanelStyle}>
          <div style={sectionTitleStyle}>Reglas disponibles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAlertas.map((alerta) => {
              const active = alerta.id === selectedAlerta?.id

              return (
                <button
                  key={alerta.id}
                  onClick={() => handleSelect(alerta)}
                  style={{
                    ...leftCardStyle,
                    border: active ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: active ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <div style={leftCardTitleStyle}>{alerta.nombre}</div>
                  <div style={leftCardMetaStyle}>{humanize(alerta.modulo)}</div>
                  <div style={leftCardDescriptionStyle}>{alerta.descripcion || 'Sin condición configurada'}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={priorityBadgeStyle(normalizePriority(alerta.severidad))}>
                      {humanize(normalizePriority(alerta.severidad))}
                    </span>
                    <span style={statusBadgeStyle(Boolean(alerta.activo))}>
                      {alerta.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>Nombre de la alerta</div>
              <div>Módulo</div>
              <div>Condición</div>
              <div>Prioridad</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>

            {filteredAlertas.length === 0 ? (
              <div style={emptyRowStyle}>No hay reglas que coincidan con los filtros.</div>
            ) : (
              filteredAlertas.map((alerta) => (
                <div
                  key={alerta.id}
                  style={{
                    ...tableRowStyle,
                    background: alerta.id === selectedAlerta?.id ? '#eef4ff' : '#ffffff',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{alerta.nombre}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {alerta.codigo || 'Sin código'}
                    </div>
                  </div>
                  <div>
                    <span style={moduleBadgeStyle}>{humanize(alerta.modulo)}</span>
                  </div>
                  <div style={conditionStyle}>{alerta.descripcion || '-'}</div>
                  <div>
                    <span style={priorityBadgeStyle(normalizePriority(alerta.severidad))}>
                      {humanize(normalizePriority(alerta.severidad))}
                    </span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(alerta)}
                      style={toggleVisualStyle(Boolean(alerta.activo))}
                      title={alerta.activo ? 'Desactivar regla' : 'Activar regla'}
                    >
                      <span style={toggleKnobStyle(Boolean(alerta.activo))} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => handleSelect(alerta)} style={miniButtonStyle}>
                      Editar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>Configuración de la regla</div>

            {!selectedAlerta ? (
              <div style={{ fontSize: 14, color: '#6b7280' }}>Seleccione una regla para editarla.</div>
            ) : (
              <>
                <div style={twoColsStyle}>
                  <Field
                    label="Nombre"
                    value={form.nombre}
                    onChange={(value) => setForm((state) => ({ ...state, nombre: value }))}
                  />
                  <Field
                    label="Código"
                    value={form.codigo}
                    onChange={(value) => setForm((state) => ({ ...state, codigo: value }))}
                  />
                  <SelectField
                    label="Módulo"
                    value={form.modulo}
                    onChange={(value) => setForm((state) => ({ ...state, modulo: value }))}
                    options={availableModules}
                  />
                  <SelectField
                    label="Prioridad"
                    value={form.severidad}
                    onChange={(value) => setForm((state) => ({ ...state, severidad: value }))}
                    options={prioridades}
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <TextAreaField
                    label="Condición de activación"
                    value={form.condicion}
                    onChange={(value) => setForm((state) => ({ ...state, condicion: value }))}
                    placeholder="Ejemplo: Días sin rendición > 60"
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <ToggleItem
                    title="Regla activa"
                    subtitle="La regla queda disponible para el motor de alertas."
                    checked={form.activo}
                    onChange={(value) => setForm((state) => ({ ...state, activo: value }))}
                  />
                </div>

                <div style={footerActionsStyle}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!selectedAlerta || deleting}
                    style={dangerButtonStyle}
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar regla'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!selectedAlerta || saving}
                    style={darkButtonStyle}
                  >
                    {saving ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
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
  onChange: (value: string) => void
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
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
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </select>
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
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  onChange: (value: boolean) => void
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
        style={toggleVisualStyle(checked)}
      >
        <span style={toggleKnobStyle(checked)} />
      </button>
    </div>
  )
}

function humanize(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizePriority(priority?: string | null) {
  if (priority === 'baja') return 'informativa'
  if (priority === 'critica' || priority === 'alta' || priority === 'media' || priority === 'informativa') {
    return priority
  }
  return 'media'
}

function priorityBadgeStyle(priority: string): React.CSSProperties {
  if (priority === 'critica') {
    return badgeStyle('#fee2e2', '#dc2626', '1px solid #fecaca')
  }

  if (priority === 'alta') {
    return badgeStyle('#ffedd5', '#ea580c', '1px solid #fed7aa')
  }

  if (priority === 'informativa') {
    return badgeStyle('#dbeafe', '#2563eb', '1px solid #bfdbfe')
  }

  return badgeStyle('#fef3c7', '#ca8a04', '1px solid #fde68a')
}

function statusBadgeStyle(active: boolean): React.CSSProperties {
  return active
    ? badgeStyle('#dcfce7', '#16a34a', '1px solid #bbf7d0')
    : badgeStyle('#f3f4f6', '#6b7280', '1px solid #e5e7eb')
}

function badgeStyle(background: string, color: string, border: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: '0 8px',
    borderRadius: 999,
    background,
    color,
    border,
    fontSize: 11,
    fontWeight: 700,
  }
}

function toggleVisualStyle(active: boolean): React.CSSProperties {
  return {
    width: 42,
    height: 24,
    borderRadius: 999,
    border: 'none',
    background: active ? '#111827' : '#e5e7eb',
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
  }
}

function toggleKnobStyle(active: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: 3,
    left: active ? 21 : 3,
    width: 18,
    height: 18,
    borderRadius: 999,
    background: '#ffffff',
    transition: 'all .2s ease',
  }
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
}

const breadcrumbStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 10,
  fontWeight: 500,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 800,
  color: '#111827',
}

const subtitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.6,
  maxWidth: 540,
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  gap: 16,
  alignItems: 'start',
}

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  padding: 12,
}

const filterSelectStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  color: '#374151',
  padding: '0 10px',
  fontWeight: 600,
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

const leftCardTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 4,
  textAlign: 'left',
}

const leftCardMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  marginBottom: 6,
  textAlign: 'left',
}

const leftCardDescriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.5,
  textAlign: 'left',
  marginBottom: 10,
}

const tableCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr 1.4fr 0.8fr 0.7fr 0.7fr',
  gap: 12,
  padding: '12px 16px',
  background: '#f9fafb',
  color: '#6b7280',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr 1.4fr 0.8fr 0.7fr 0.7fr',
  gap: 12,
  padding: '14px 16px',
  borderTop: '1px solid #f3f4f6',
  alignItems: 'center',
}

const emptyRowStyle: React.CSSProperties = {
  padding: 16,
  fontSize: 14,
  color: '#6b7280',
  borderTop: '1px solid #f3f4f6',
}

const moduleBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  padding: '0 8px',
  borderRadius: 999,
  background: '#f3f4f6',
  color: '#6b7280',
  fontSize: 11,
  fontWeight: 700,
}

const conditionStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#374151',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  lineHeight: 1.5,
}

const panelCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  border: '1px solid #e5e7eb',
  padding: 16,
}

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 14,
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

const twoColsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
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
  minHeight: 74,
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

const toggleItemStyle: React.CSSProperties = {
  borderRadius: 12,
  background: '#ffffff',
  border: '1px solid #f3f4f6',
  padding: 10,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const footerActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 16,
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

const miniButtonStyle: React.CSSProperties = {
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

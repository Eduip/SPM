'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MunicipalAISettings } from '../../../lib/ai/municipal-ai-settings'
import type { StrategicDocument } from '../../../lib/ai/strategic-documents'
import {
  eliminarDocumentoEstrategicoIA,
  guardarParametrosIA,
  subirDocumentoEstrategicoIA,
} from '../../../app/administracion/parametros-ia/actions'

export default function ParametrosIAPage({
  initialSettings,
  strategicDocuments,
}: {
  initialSettings: MunicipalAISettings
  strategicDocuments: StrategicDocument[]
}) {
  const router = useRouter()
  const [form, setForm] = useState(initialSettings)
  const [documents, setDocuments] = useState(strategicDocuments)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    const result = await guardarParametrosIA(form)

    setSaving(false)

    if (!result.success) {
      setError(
        'error' in result
          ? result.error || 'No se pudieron guardar los parámetros IA.'
          : 'No se pudieron guardar los parámetros IA.'
      )
      return
    }

    setForm(result.settings)
    setMessage('Parámetros IA guardados correctamente.')
    router.refresh()
  }

  const handleUploadStrategicDocument = async (formData: FormData) => {
    setUploading(true)
    setMessage('')
    setError('')

    const result = await subirDocumentoEstrategicoIA(formData)

    setUploading(false)

    if (!result.success) {
      setError(
        'error' in result
          ? result.error || 'No se pudo cargar el documento estratégico.'
          : 'No se pudo cargar el documento estratégico.'
      )
      return
    }

    if ('document' in result && result.document) {
      setDocuments((current) => [result.document, ...current.filter((item) => item.id !== result.document.id)])
    }

    setMessage('Documento estratégico procesado correctamente.')
  }

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm('¿Eliminar este documento estratégico?')
    if (!confirmed) return

    setError('')
    setMessage('')

    const result = await eliminarDocumentoEstrategicoIA(documentId)

    if (!result.success) {
      setError(
        'error' in result
          ? result.error || 'No se pudo eliminar el documento estratégico.'
          : 'No se pudo eliminar el documento estratégico.'
      )
      return
    }

    setDocuments((current) => current.filter((item) => item.id !== documentId))
    setMessage('Documento estratégico eliminado correctamente.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
        }}
      >
        <div>
          <div style={breadcrumbStyle}>Administración &gt; Parámetros IA</div>
          <h1 style={titleStyle}>Parámetros IA</h1>
          <p style={descriptionStyle}>
            Configura la visión institucional que la IA debe considerar al formular
            proyectos, redactar diagnósticos y proponer contenido técnico.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => setForm(initialSettings)} style={secondaryButtonStyle}>
            Restaurar vista inicial
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={primaryButtonStyle(saving)}>
            {saving ? 'Guardando...' : 'Guardar parámetros'}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          style={{
            borderRadius: 16,
            padding: '14px 16px',
            background: error ? '#fef2f2' : '#ecfdf5',
            border: error ? '1px solid #fecaca' : '1px solid #bbf7d0',
            color: error ? '#b91c1c' : '#166534',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error || message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 0.85fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SettingsSection
            title="Visión y prioridades políticas"
            subtitle="Dirección estratégica que la IA debe privilegiar al redactar."
          >
            <ToggleField
              label="Usar visión del alcalde"
              checked={form.enabled.mayorVision}
              onChange={(checked) => updateEnabled(setForm, 'mayorVision', checked)}
            />
            <TextAreaField
              label="Visión del alcalde"
              value={form.mayorVision}
              onChange={(value) => updateField(setForm, 'mayorVision', value)}
              placeholder="Describe la visión política y de desarrollo que debe guiar la formulación..."
              minHeight={170}
            />

            <ToggleField
              label="Usar prioridades comunales"
              checked={form.enabled.municipalPriorities}
              onChange={(checked) => updateEnabled(setForm, 'municipalPriorities', checked)}
            />
            <TextAreaField
              label="Prioridades municipales"
              value={form.municipalPriorities}
              onChange={(value) => updateField(setForm, 'municipalPriorities', value)}
              placeholder="Ej: conectividad, infraestructura habilitante, seguridad, desarrollo económico local..."
              minHeight={130}
            />
          </SettingsSection>

          <SettingsSection
            title="Criterios de redacción"
            subtitle="Reglas finas para modular tono, conceptos y enfoque."
          >
            <ToggleField
              label="Usar enfoques transversales"
              checked={form.enabled.transversalApproaches}
              onChange={(checked) => updateEnabled(setForm, 'transversalApproaches', checked)}
            />
            <TextAreaField
              label="Enfoques transversales"
              value={form.transversalApproaches}
              onChange={(value) => updateField(setForm, 'transversalApproaches', value)}
              placeholder="Ej: enfoque territorial, inclusión, desarrollo sostenible, género, infancia, pueblos originarios..."
              minHeight={140}
            />

            <ToggleField
              label="Usar instrucciones de redacción"
              checked={form.enabled.draftingInstructions}
              onChange={(checked) => updateEnabled(setForm, 'draftingInstructions', checked)}
            />
            <TextAreaField
              label="Instrucciones de redacción"
              value={form.draftingInstructions}
              onChange={(value) => updateField(setForm, 'draftingInstructions', value)}
              placeholder="Ej: priorizar lenguaje técnico, destacar impacto territorial, justificar con foco en desarrollo local..."
              minHeight={130}
            />
          </SettingsSection>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SettingsSection
            title="Documentos estratégicos"
            subtitle="Sube PDFs institucionales para que la IA consulte solo los fragmentos relevantes al formular."
          >
            <form action={handleUploadStrategicDocument} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input name="name" placeholder="Nombre del documento estratégico" required style={inputStyle} />
              <select name="type" defaultValue="pladeco" style={inputStyle}>
                <option value="pladeco">PLADECO</option>
                <option value="regional-plan">Plan de Desarrollo Regional</option>
                <option value="mayor-vision">Visión del alcalde</option>
                <option value="sectoral">Otro lineamiento</option>
              </select>
              <input name="file" type="file" accept="application/pdf" required style={inputStyle} />
              <button type="submit" disabled={uploading} style={primaryButtonStyle(uploading)}>
                {uploading ? 'Procesando PDF...' : 'Subir y fragmentar PDF'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {documents.length ? (
                documents.map((document) => (
                  <div key={document.id} style={documentCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>
                          {document.name}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {document.originalFileName} · {document.pageCount} páginas · {document.chunkCount} fragmentos
                        </div>
                      </div>
                      <button type="button" onClick={() => handleDeleteDocument(document.id)} style={deleteButtonStyle}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyHintStyle}>
                  Aún no hay documentos estratégicos cargados. Un PLADECO o lineamiento breve en PDF ya puede empezar a alimentar la formulación.
                </div>
              )}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Palabras y restricciones"
            subtitle="Refuerza conceptos clave y evita formulaciones no deseadas."
          >
            <ToggleField
              label="Usar palabras clave"
              checked={form.enabled.keywords}
              onChange={(checked) => updateEnabled(setForm, 'keywords', checked)}
            />
            <TextAreaField
              label="Palabras clave"
              value={form.keywords}
              onChange={(value) => updateField(setForm, 'keywords', value)}
              placeholder="Ej: conectividad, desarrollo económico, infraestructura habilitante, articulación territorial..."
              minHeight={120}
            />

            <ToggleField
              label="Usar restricciones o términos a evitar"
              checked={form.enabled.avoidTerms}
              onChange={(checked) => updateEnabled(setForm, 'avoidTerms', checked)}
            />
            <TextAreaField
              label="Términos o enfoques a evitar"
              value={form.avoidTerms}
              onChange={(value) => updateField(setForm, 'avoidTerms', value)}
              placeholder="Indica palabras o enfoques que la IA no debiera priorizar..."
              minHeight={120}
            />
          </SettingsSection>

          <SettingsSection
            title="Resumen operativo"
            subtitle="Qué está usando hoy la IA para formular."
          >
            <SummaryRow label="Visión del alcalde" active={form.enabled.mayorVision} hasContent={Boolean(form.mayorVision)} />
            <SummaryRow label="Prioridades comunales" active={form.enabled.municipalPriorities} hasContent={Boolean(form.municipalPriorities)} />
            <SummaryRow label="Enfoques transversales" active={form.enabled.transversalApproaches} hasContent={Boolean(form.transversalApproaches)} />
            <SummaryRow label="Instrucciones de redacción" active={form.enabled.draftingInstructions} hasContent={Boolean(form.draftingInstructions)} />
            <SummaryRow label="Palabras clave" active={form.enabled.keywords} hasContent={Boolean(form.keywords)} />
            <SummaryRow label="Restricciones" active={form.enabled.avoidTerms} hasContent={Boolean(form.avoidTerms)} />
            <SummaryRow label="Documentos estratégicos IA" active={documents.length > 0} hasContent={documents.length > 0} />

            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}
            >
              Esta versión guarda la configuración como archivo local del sistema para poder iterar rápido sin tocar el esquema de base de datos.
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section style={panelStyle}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-strong)' }}>
          {title}
        </h2>
        <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          {subtitle}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </section>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-strong)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  minHeight: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight,
          borderRadius: 16,
          background: '#f9fafb',
          border: '1px solid var(--border)',
          padding: 16,
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text)',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  )
}

function SummaryRow({
  label,
  active,
  hasContent,
}: {
  label: string
  active: boolean
  hasContent: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 12,
        background: '#f8fafc',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatusChip label={active ? 'Activo' : 'Inactivo'} tone={active ? 'success' : 'muted'} />
        <StatusChip label={hasContent ? 'Con contenido' : 'Vacío'} tone={hasContent ? 'info' : 'muted'} />
      </div>
    </div>
  )
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: 'success' | 'info' | 'muted'
}) {
  const styles =
    tone === 'success'
      ? { background: '#dcfce7', color: '#166534' }
      : tone === 'info'
        ? { background: '#dbeafe', color: '#1d4ed8' }
        : { background: '#f3f4f6', color: '#6b7280' }

  return (
    <span
      style={{
        ...styles,
        borderRadius: 999,
        padding: '4px 9px',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  )
}

function updateField(
  setForm: React.Dispatch<React.SetStateAction<MunicipalAISettings>>,
  field: keyof Omit<MunicipalAISettings, 'version' | 'updatedAt' | 'enabled'>,
  value: string
) {
  setForm((current) => ({ ...current, [field]: value }))
}

function updateEnabled(
  setForm: React.Dispatch<React.SetStateAction<MunicipalAISettings>>,
  field: keyof MunicipalAISettings['enabled'],
  checked: boolean
) {
  setForm((current) => ({
    ...current,
    enabled: {
      ...current.enabled,
      [field]: checked,
    },
  }))
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
  color: 'var(--text-strong)',
}

const descriptionStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: '#6b7280',
  lineHeight: 1.6,
}

const panelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 20,
  border: '1px solid var(--border)',
  padding: 20,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 12,
  background: '#ffffff',
  border: '1px solid var(--border)',
  padding: '0 14px',
  fontSize: 14,
  color: 'var(--text)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const documentCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: '#f8fafc',
  padding: '14px 16px',
}

const emptyHintStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: '14px 16px',
  color: 'var(--text-muted)',
  fontSize: 14,
  lineHeight: 1.55,
}

const deleteButtonStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#ffffff',
  color: '#b91c1c',
  padding: '0 12px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
  flexShrink: 0,
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: '#ffffff',
  color: 'var(--text-strong)',
  padding: '0 14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 12,
    border: 'none',
    background: 'var(--primary)',
    color: '#ffffff',
    padding: '0 14px',
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  }
}

'use client'

import { useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { generateDiagnosticoDraft } from '../../../app/creacion-formulacion/diagnostico/actions'
import type { DiagnosticoItem } from './DiagnosticoFormContainer'

type DraftItem = {
  title: string
  description: string
}

type DiagnosticoDraft = {
  problemaCentral: string
  justificacion: string
  causas: DraftItem[]
  consecuencias: DraftItem[]
}

type Props = {
  proyectoId: string
  problemaCentral: string
  justificacion: string
  onApplyDraft: (draft: {
    problemaCentral: string
    justificacion: string
    causas: DiagnosticoItem[]
    consecuencias: DiagnosticoItem[]
  }) => void
  onApplyProblema: (value: string) => void
  onApplyJustificacion: (value: string) => void
}

export default function DiagnosticoAIPanel({
  proyectoId,
  problemaCentral,
  justificacion,
  onApplyDraft,
  onApplyProblema,
  onApplyJustificacion,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState<DiagnosticoDraft | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setNotice('')

    const result = await generateDiagnosticoDraft({
      proyectoId,
      problemaCentralActual: problemaCentral,
      justificacionActual: justificacion,
    })

    if (!result.success) {
      setError(result.error || 'No se pudo generar el borrador.')
      setLoading(false)
      return
    }

    setDraft(result.draft || null)
    setNotice('notice' in result ? result.notice || '' : '')
    setLoading(false)
  }

  const applyFullDraft = () => {
    if (!draft) return

    onApplyDraft({
      problemaCentral: draft.problemaCentral,
      justificacion: draft.justificacion,
      causas: draft.causas.map((item) => mapDraftItem(item, 'causas')),
      consecuencias: draft.consecuencias.map((item) =>
        mapDraftItem(item, 'consecuencias')
      ),
    })
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        border: '1px solid var(--border)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--primary)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            <Sparkles size={14} />
            IA Diagnóstico
          </div>
          <h3
            style={{
              margin: '8px 0 4px 0',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text-strong)',
            }}
          >
            Apoyo de redacción
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
            Genera un borrador sugerido para problema central, justificación, causas y consecuencias.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          style={primaryButtonStyle(loading)}
        >
          <Wand2 size={16} />
          {loading ? 'Generando...' : 'Generar borrador'}
        </button>
      </div>

      {error && <MessageBox tone="error" text={error} />}
      {notice && <MessageBox tone="info" text={notice} />}

      {draft ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DraftSection
            title="Problema central sugerido"
            body={draft.problemaCentral}
            actionLabel="Usar problema central"
            onAction={() => onApplyProblema(draft.problemaCentral)}
          />

          <DraftSection
            title="Justificación sugerida"
            body={draft.justificacion}
            actionLabel="Usar justificación"
            onAction={() => onApplyJustificacion(draft.justificacion)}
          />

          <TwoColumnList
            leftTitle="Causas sugeridas"
            rightTitle="Consecuencias sugeridas"
            leftItems={draft.causas}
            rightItems={draft.consecuencias}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={applyFullDraft} style={secondaryButtonStyle}>
              Aplicar todo al formulario
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px dashed #cbd5e1',
            background: '#f8fafc',
            padding: '16px 18px',
            fontSize: 14,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          La sugerencia se construye usando la información ya registrada del proyecto para que el usuario la revise y decida si la aplica.
        </div>
      )}
    </div>
  )
}

function DraftSection({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div style={draftBoxStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{body}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button type="button" onClick={onAction} style={miniActionButtonStyle}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

function TwoColumnList({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
}: {
  leftTitle: string
  rightTitle: string
  leftItems: DraftItem[]
  rightItems: DraftItem[]
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      }}
    >
      <ListColumn title={leftTitle} items={leftItems} />
      <ListColumn title={rightTitle} items={rightItems} />
    </div>
  )
}

function ListColumn({ title, items }: { title: string; items: DraftItem[] }) {
  return (
    <div style={draftBoxStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, index) => (
          <div key={`${title}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>
              {item.title}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessageBox({ tone, text }: { tone: 'error' | 'info'; text: string }) {
  const isError = tone === 'error'

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '12px 14px',
        background: isError ? '#fef2f2' : '#eff6ff',
        border: isError ? '1px solid #fecaca' : '1px solid #bfdbfe',
        color: isError ? '#b91c1c' : '#1d4ed8',
        fontSize: 13,
        lineHeight: 1.55,
        fontWeight: 600,
      }}
    >
      {text}
    </div>
  )
}

function mapDraftItem(item: DraftItem, type: 'causas' | 'consecuencias'): DiagnosticoItem {
  return {
    id: crypto.randomUUID(),
    title: item.title,
    description: item.description,
    color: type === 'causas' ? 'var(--primary-soft)' : '#fef3c7',
    iconColor: type === 'causas' ? '#3b82f6' : '#eab308',
  }
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 42,
    borderRadius: 12,
    border: 'none',
    background: 'var(--primary)',
    color: '#ffffff',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    flexShrink: 0,
  }
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--surface-muted)',
  color: 'var(--text-strong)',
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const miniActionButtonStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: '#ffffff',
  color: 'var(--primary)',
  padding: '0 12px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
}

const draftBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid var(--border)',
  background: '#f8fafc',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-strong)',
}

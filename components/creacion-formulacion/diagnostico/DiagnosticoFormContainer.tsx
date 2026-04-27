'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DiagnosticoHeader from './DiagnosticoHeader'
import ProblemaCentralCard from './ProblemaCentralCard'
import AnalysisListCard from './AnalysisListCard'
import JustificacionCard from './JustificacionCard'
import DiagnosticoAIPanel from './DiagnosticoAIPanel'
import AlertasActivasPanel from './AlertasActivasPanel'
import FiltrosDiagnosticoPanel from './FiltrosDiagnosticoPanel'
import UltimosDocumentosPanel from './UltimosDocumentosPanel'
import DiagnosticoProgressPanel from './DiagnosticoProgressPanel'
import { saveDiagnosticoData } from '../../../app/creacion-formulacion/diagnostico/actions'

export type DiagnosticoItem = {
  id: string
  title: string
  description: string
  color: string
  iconColor: string
}

export type DiagnosticoDocumento = {
  id: string
  nombre: string
  nombre_archivo: string
  tamano_bytes: number | null
  fecha_subida: string
  profile:
    | {
        nombre_completo: string
      }[]
    | null
}

type InitialDiagnostico = {
  problema_central: string | null
  justificacion: string | null
  causas:
    | {
        id: string
        titulo: string | null
        descripcion: string | null
      }[]
    | null
  consecuencias:
    | {
        id: string
        titulo: string | null
        descripcion: string | null
      }[]
    | null
}

type DiagnosticoFormContainerProps = {
  proyectoId: string
  diagnostico: InitialDiagnostico | null
  documentos: DiagnosticoDocumento[]
}

export default function DiagnosticoFormContainer({
  proyectoId,
  diagnostico,
  documentos,
}: DiagnosticoFormContainerProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [problemaCentral, setProblemaCentral] = useState(
    diagnostico?.problema_central ?? ''
  )

  const [justificacion, setJustificacion] = useState(
    diagnostico?.justificacion ?? ''
  )

  const [causas, setCausas] = useState<DiagnosticoItem[]>(() =>
    buildInitialItems(diagnostico?.causas, 'causas')
  )

  const [consecuencias, setConsecuencias] = useState<DiagnosticoItem[]>(() =>
    buildInitialItems(diagnostico?.consecuencias, 'consecuencias')
  )

  const updateItem = (
    type: 'causas' | 'consecuencias',
    id: string,
    field: 'title' | 'description',
    value: string
  ) => {
    const setter = type === 'causas' ? setCausas : setConsecuencias
    const current = type === 'causas' ? causas : consecuencias

    setter(
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const addItem = (type: 'causas' | 'consecuencias') => {
    const newItem: DiagnosticoItem = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      color: type === 'causas' ? 'var(--primary-soft)' : '#fef3c7',
      iconColor: type === 'causas' ? '#3b82f6' : '#eab308',
    }

    if (type === 'causas') {
      setCausas((prev) => [...prev, newItem])
    } else {
      setConsecuencias((prev) => [...prev, newItem])
    }
  }

  const removeItem = (type: 'causas' | 'consecuencias', id: string) => {
    if (type === 'causas') {
      setCausas((prev) => prev.filter((item) => item.id !== id))
    } else {
      setConsecuencias((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    const result = await saveDiagnosticoData({
      proyectoId,
      problemaCentral,
      justificacion,
      causas,
      consecuencias,
    })

    if (!result.success) {
      setSaveError(result.error || 'Ocurrió un error al guardar el diagnóstico.')
      setSaving(false)
      return
    }

    setSaveSuccess('Diagnóstico guardado correctamente.')
    setSaving(false)
    router.refresh()
  }

  const applyGeneratedDraft = (draft: {
    problemaCentral: string
    justificacion: string
    causas: DiagnosticoItem[]
    consecuencias: DiagnosticoItem[]
  }) => {
    setProblemaCentral(draft.problemaCentral)
    setJustificacion(draft.justificacion)
    setCausas(draft.causas)
    setConsecuencias(draft.consecuencias)
    setSaveSuccess('Borrador IA aplicado al formulario. Revisa el contenido antes de guardar.')
    setSaveError('')
  }

  return (
    <>
      <DiagnosticoHeader
        onSave={handleSave}
        saving={saving}
        backHref={`/creacion-formulacion?proyectoId=${proyectoId}`}
      />

      {(saveError || saveSuccess) && (
        <div
          style={{
            borderRadius: 16,
            padding: '16px 18px',
            background: saveError ? '#fef2f2' : '#ecfdf5',
            border: saveError ? '1px solid #fecaca' : '1px solid #bbf7d0',
            color: saveError ? '#b91c1c' : '#166534',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {saveError || saveSuccess}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DiagnosticoAIPanel
            proyectoId={proyectoId}
            problemaCentral={problemaCentral}
            justificacion={justificacion}
            onApplyProblema={setProblemaCentral}
            onApplyJustificacion={setJustificacion}
            onApplyDraft={applyGeneratedDraft}
          />

          <ProblemaCentralCard
            value={problemaCentral}
            onChange={setProblemaCentral}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
            }}
          >
            <AnalysisListCard
              title="Análisis de Causas"
              items={causas}
              type="causas"
              onAdd={() => addItem('causas')}
              onRemove={(id) => removeItem('causas', id)}
              onChange={(id, field, value) =>
                updateItem('causas', id, field, value)
              }
            />
            <AnalysisListCard
              title="Análisis de Consecuencias"
              items={consecuencias}
              type="consecuencias"
              onAdd={() => addItem('consecuencias')}
              onRemove={(id) => removeItem('consecuencias', id)}
              onChange={(id, field, value) =>
                updateItem('consecuencias', id, field, value)
              }
            />
          </div>

          <JustificacionCard
            proyectoId={proyectoId}
            value={justificacion}
            onChange={setJustificacion}
            documentos={documentos}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AlertasActivasPanel />
          <FiltrosDiagnosticoPanel />
          <UltimosDocumentosPanel />
          <DiagnosticoProgressPanel proyectoId={proyectoId} />
        </div>
      </div>
    </>
  )
}

function buildInitialItems(
  items:
    | {
        id: string
        titulo: string | null
        descripcion: string | null
      }[]
    | null
    | undefined,
  type: 'causas' | 'consecuencias'
) {
  const source = items?.length
    ? items
    : [{ id: crypto.randomUUID(), titulo: '', descripcion: '' }]

  return source.map((item) => ({
    id: item.id,
    title: item.titulo ?? '',
    description: item.descripcion ?? '',
    color: type === 'causas' ? 'var(--primary-soft)' : '#fef3c7',
    iconColor: type === 'causas' ? '#3b82f6' : '#eab308',
  }))
}

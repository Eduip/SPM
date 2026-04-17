'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DiagnosticoHeader from './DiagnosticoHeader'
import ProblemaCentralCard from './ProblemaCentralCard'
import AnalysisListCard from './AnalysisListCard'
import JustificacionCard from './JustificacionCard'
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

type DiagnosticoFormContainerProps = {
  proyectoId: string
}

export default function DiagnosticoFormContainer({
  proyectoId,
}: DiagnosticoFormContainerProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [problemaCentral, setProblemaCentral] = useState(
    'Las calles y caminos del sector norte de la comuna de Curacautín presentan deterioro significativo en su pavimentación, con grietas, hundimientos y desgaste generalizado que afecta directamente la calidad de vida de aproximadamente 3.500 habitantes.'
  )

  const [justificacion, setJustificacion] = useState(
    'La pavimentación de calles y caminos en el sector norte de Curacautín constituye una inversión fundamental para mejorar la calidad de vida de los habitantes, garantizar su seguridad vial y promover el desarrollo económico local.'
  )

  const [causas, setCausas] = useState<DiagnosticoItem[]>([
    {
      id: crypto.randomUUID(),
      title: 'Falta de inversión en infraestructura',
      description:
        'Presupuesto municipal limitado para mantención vial durante los últimos 5 años',
      color: '#fee2e2',
      iconColor: '#ef4444',
    },
    {
      id: crypto.randomUUID(),
      title: 'Drenaje deficiente que deteriora el camino',
      description:
        'Sistema de evacuación de aguas lluvia inexistente o colapsado en la zona',
      color: '#dbeafe',
      iconColor: '#3b82f6',
    },
  ])

  const [consecuencias, setConsecuencias] = useState<DiagnosticoItem[]>([
    {
      id: crypto.randomUUID(),
      title: 'Mayor riesgo de accidentes',
      description:
        'Incremento del 35% en accidentes de tránsito en el sector durante 2023',
      color: '#fee2e2',
      iconColor: '#ef4444',
    },
    {
      id: crypto.randomUUID(),
      title: 'Problemas de salud por polvo',
      description:
        'Aumento de enfermedades respiratorias en población infantil y adulta mayor',
      color: '#fce7f3',
      iconColor: '#ec4899',
    },
  ])

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
      color: type === 'causas' ? '#dbeafe' : '#fef3c7',
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

  return (
    <>
      <DiagnosticoHeader onSave={handleSave} saving={saving} />

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
            value={justificacion}
            onChange={setJustificacion}
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
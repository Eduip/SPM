'use client'

import { useState } from 'react'
import PostulacionHeader from './PostulacionHeader'
import PostulacionStepper from './PostulacionStepper'
import PostulacionProgressPanel from './PostulacionProgressPanel'
import { savePostulacionData } from '../../../app/creacion-formulacion/postulacion/actions'
import FuenteFinanciamientoSelector from './FuenteFinanciamientoSelector'

import DynamicFuenteFields from './DynamicFuenteFields'
import type {
  CampoPostulacion,
  FuenteCatalogo,
  ReglaFuente,
  RespuestaPostulacion,
} from '../../../lib/formulacion-types'

export default function PostulacionFormContainer({
  proyectoId,
  fuentesCatalogo,
  camposFuente,
  respuestasIniciales,
  selectedFuenteId,
}: {
  proyectoId: string
  fuentesCatalogo: FuenteCatalogo[]
  camposFuente: CampoPostulacion[]
  reglasFuente: ReglaFuente[]
  respuestasIniciales: RespuestaPostulacion[]
  selectedFuenteId: string
}) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [selectedFuente, setSelectedFuente] = useState(selectedFuenteId)

  const puntajeDiagnostico = 5
  const puntajePertinencia = 0
  const puntajeRS = 0
  const puntajeTotal = puntajeDiagnostico + puntajePertinencia + puntajeRS
  const porcentajeEvaluacion = Math.round((puntajeTotal / 35) * 100)
  const aprobado = puntajeTotal >= 21
  const selectedFuenteNombre =
    fuentesCatalogo.find((fuente) => String(fuente.id) === String(selectedFuente))
      ?.nombre ?? ''

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    const result = await savePostulacionData({
      proyectoId,
      fuenteId: selectedFuente,
      puntajeDiagnostico,
      puntajePertinencia,
      puntajeRS,
      puntajeTotal,
      porcentajeEvaluacion,
      aprobado,
    })

    if (!result.success) {
      setSaveError(result.error || 'Ocurrió un error al guardar la postulación.')
      setSaving(false)
      return
    }

    setSaveSuccess('Postulación guardada correctamente.')
    setSaving(false)
  }

  return (
    <>
      <PostulacionHeader
        onSave={handleSave}
        saving={saving}
        backHref={`/creacion-formulacion?proyectoId=${proyectoId}`}
      />
      <PostulacionStepper />

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
          borderRadius: 16,
          border: '1px solid #fde68a',
          background: '#fffbeb',
          color: '#92400e',
          padding: '16px 18px',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Complete la información de postulación requerida para formular su proyecto.
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
          Seleccione la fuente de financiamiento antes de completar el formulario.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FuenteFinanciamientoSelector
            fuentes={fuentesCatalogo}
            selectedFuenteId={selectedFuente}
            onChange={setSelectedFuente}
          />

          <DynamicFuenteFields
            key={selectedFuente || 'sin-fuente'}
            proyectoId={proyectoId}
            fuenteId={selectedFuente || null}
            fuenteNombre={selectedFuenteNombre}
            campos={camposFuente}
            respuestasIniciales={respuestasIniciales ?? []}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PostulacionProgressPanel proyectoId={proyectoId} />
        </div>
      </div>
    </>
  )
}

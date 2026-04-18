'use client'

import { useState } from 'react'
import PerfilProyectoCard from './PerfilProyectoCard'
import ResumenProyectoPanel from './ResumenProyectoPanel'
import PostulacionProgressPanel from './PostulacionProgressPanel'
import AlertasActivasPanel from '../diagnostico/AlertasActivasPanel'
import UltimosDocumentosPanel from '../diagnostico/UltimosDocumentosPanel'
import PostulacionHeader from './PostulacionHeader'
import PostulacionStepper from './PostulacionStepper'
import { savePostulacionData } from '../../../app/creacion-formulacion/postulacion/actions'
import FuenteFinanciamientoSelector from './FuenteFinanciamientoSelector'
import DocumentosFuenteCard from './DocumentosFuenteCard'

import DynamicFuenteFields from './DynamicFuenteFields'
import type {
  CampoPostulacion,
  DocumentoFuente,
  FuenteCatalogo,
  ReglaFuente,
  RespuestaPostulacion,
} from '../../../lib/formulacion-types'
import type { ProyectoFicha } from '../../../lib/project-types'

export default function PostulacionFormContainer({
  proyectoId,
  proyecto,
  fuentesCatalogo,
  camposFuente,
  documentosFuente,
  respuestasIniciales,
  selectedFuenteId,
}: {
  proyectoId: string
  proyecto: ProyectoFicha | null
  fuentesCatalogo: FuenteCatalogo[]
  camposFuente: CampoPostulacion[]
  documentosFuente: DocumentoFuente[]
  reglasFuente: ReglaFuente[]
  respuestasIniciales: RespuestaPostulacion[]
  selectedFuenteId: string
}) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [selectedFuente, setSelectedFuente] = useState(selectedFuenteId)
  const [tipoProyecto, setTipoProyecto] = useState('')
  const [nombreProyecto, setNombreProyecto] = useState(proyecto?.nombre ?? '')
  const [montoTotal, setMontoTotal] = useState(
    proyecto?.monto_estimado ? String(proyecto.monto_estimado) : ''
  )
  const [unidadResponsable, setUnidadResponsable] = useState(
    proyecto?.unidad?.nombre ?? ''
  )
  const [utmX, setUtmX] = useState('')
  const [utmY, setUtmY] = useState('')
  const [periodo, setPeriodo] = useState('')

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
      tipoProyecto,
      nombreProyecto,
      montoTotal,
      unidadResponsable,
      utmX,
      utmY,
      periodo,
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
        backHref={`/creacion-formulacion/diagnostico?proyectoId=${proyectoId}`}
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

          <PerfilProyectoCard
            tipoProyecto={tipoProyecto}
            setTipoProyecto={setTipoProyecto}
            nombreProyecto={nombreProyecto}
            setNombreProyecto={setNombreProyecto}
            montoTotal={montoTotal}
            setMontoTotal={setMontoTotal}
            unidadResponsable={unidadResponsable}
            setUnidadResponsable={setUnidadResponsable}
            utmX={utmX}
            setUtmX={setUtmX}
            utmY={utmY}
            setUtmY={setUtmY}
            periodo={periodo}
            setPeriodo={setPeriodo}
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
          <ResumenProyectoPanel
            montoTotal={montoTotal}
            periodo={periodo}
            utmX={utmX}
            utmY={utmY}
          />

          <DocumentosFuenteCard
            documentos={documentosFuente}
            selectedFuenteId={selectedFuente}
          />

          <AlertasActivasPanel />
          <PostulacionProgressPanel proyectoId={proyectoId} />
          <UltimosDocumentosPanel />
        </div>
      </div>
    </>
  )
}

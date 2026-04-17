'use client'

import AprobacionHeader from './AprobacionHeader'
import AprobacionStepper from './AprobacionStepper'
import ResumenEjecutivo from './ResumenEjecutivo'
import ResumenProyectoCard from './ResumenProyectoCard'
import ValidacionRequisitosCard from './ValidacionRequisitosCard'
import EvaluacionResumidaCard from './EvaluacionResumidaCard'
import InformacionComplementariaCard from './InformacionComplementariaCard'
import ComentariosAprobacionCard from './ComentariosAprobacionCard'
import AprobacionPanel from './AprobacionPanel'
import AlertasActivasPanel from '../diagnostico/AlertasActivasPanel'
import UltimosDocumentosPanel from '../diagnostico/UltimosDocumentosPanel'
import type {
  DiagnosticoProyecto,
  DocumentoFuente,
  PostulacionProyecto,
  ProyectoAprobacion,
} from '../../../lib/formulacion-types'

export default function AprobacionContainer({
  proyectoId,
  proyecto,
  diagnostico,
  postulacion,
  documentos,
}: {
  proyectoId: string
  proyecto: ProyectoAprobacion | null
  diagnostico: DiagnosticoProyecto | null
  postulacion: PostulacionProyecto | null
  documentos: DocumentoFuente[]
}) {
  const documentosObligatorios = documentos.filter((d) => d.obligatorio)
  const documentosOk =
    documentosObligatorios.length > 0 &&
    documentosObligatorios.every((d) =>
      ['subido', 'validado', 'pendiente_revision'].includes(d.estado_revision ?? '')
    )

  const evaluacionOk = Number(postulacion?.puntaje_total ?? 0) >= 21
  const certificacionOk = true
  const presupuestoOk = Boolean(postulacion?.monto_total)

  const puedeAprobar =
    documentosOk && evaluacionOk && certificacionOk && presupuestoOk

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AprobacionHeader />
      <AprobacionStepper />

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
        Revise la información general del proyecto y apruebe la formulación del mismo.
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
          Puede hacer comentarios para dejar un registro al finalizar.
        </div>
      </div>

      <ResumenEjecutivo proyecto={proyecto} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ResumenProyectoCard proyecto={proyecto} postulacion={postulacion} />
          <EvaluacionResumidaCard postulacion={postulacion} />
          <InformacionComplementariaCard diagnostico={diagnostico} />
          <ComentariosAprobacionCard />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ValidacionRequisitosCard
            documentosOk={documentosOk}
            evaluacionOk={evaluacionOk}
            certificacionOk={certificacionOk}
            presupuestoOk={presupuestoOk}
          />
          <AprobacionPanel
            proyectoId={proyectoId}
            puedeAprobar={puedeAprobar}
          />
          <AlertasActivasPanel />
          <UltimosDocumentosPanel />
        </div>
      </div>
    </div>
  )
}

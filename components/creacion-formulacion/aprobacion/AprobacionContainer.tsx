'use client'

import AprobacionHeader from './AprobacionHeader'
import AprobacionStepper from './AprobacionStepper'
import ResumenProyectoCard from './ResumenProyectoCard'
import ValidacionRequisitosCard from './ValidacionRequisitosCard'
import InformacionComplementariaCard from './InformacionComplementariaCard'
import ComentariosAprobacionCard from './ComentariosAprobacionCard'
import AprobacionPanel from './AprobacionPanel'
import PostulacionDinamicaCard from './PostulacionDinamicaCard'
import DocumentosRevisionCard from './DocumentosRevisionCard'
import AlertasActivasPanel from '../diagnostico/AlertasActivasPanel'
import UltimosDocumentosPanel from '../diagnostico/UltimosDocumentosPanel'
import type {
  DiagnosticoProyecto,
  CatalogoDocumentoFormulacion,
  CampoPostulacion,
  DocumentoAprobacion,
  RespuestaPostulacion,
  PostulacionProyecto,
  ProyectoAprobacion,
} from '../../../lib/formulacion-types'

export default function AprobacionContainer({
  proyectoId,
  proyecto,
  datosGenerales,
  diagnostico,
  postulacion,
  fuenteNombre,
  camposPostulacion,
  respuestasPostulacion,
  documentos,
  catalogoDocumentos,
}: {
  proyectoId: string
  proyecto: ProyectoAprobacion | null
  datosGenerales: {
    descripcion?: string | null
    poblacion_beneficiaria?: Array<{ group?: string; quantity?: string }> | null
  } | null
  diagnostico: DiagnosticoProyecto | null
  postulacion: PostulacionProyecto | null
  fuenteNombre: string
  camposPostulacion: CampoPostulacion[]
  respuestasPostulacion: RespuestaPostulacion[]
  documentos: DocumentoAprobacion[]
  catalogoDocumentos: CatalogoDocumentoFormulacion[]
}) {
  const documentosObligatorios = catalogoDocumentos.filter((d) => d.obligatorio)
  const documentosPorCatalogo = new Map(documentos.map((d) => [getRequirementId(d), d]))
  const documentosOk =
    documentosObligatorios.length === 0 ||
    documentosObligatorios.every((item) =>
      ['subido', 'validado', 'pendiente_revision'].includes(
        documentosPorCatalogo.get(item.id)?.estado_revision ?? ''
      )
    )

  const diagnosticoOk = Boolean(diagnostico?.problema_central && diagnostico?.justificacion)
  const postulacionOk = Boolean(fuenteNombre)
  const datosProyectoOk = Boolean(proyecto?.nombre && datosGenerales?.descripcion)
  const yaAprobado = proyecto?.estado === 'aprobado'

  const puedeAprobar =
    !yaAprobado && documentosOk && diagnosticoOk && postulacionOk && datosProyectoOk

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AprobacionHeader proyectoId={proyectoId} />
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ResumenProyectoCard
            proyecto={proyecto}
            postulacion={postulacion}
            datosGenerales={datosGenerales}
            fuenteNombre={fuenteNombre}
          />
          <InformacionComplementariaCard diagnostico={diagnostico} />
          <PostulacionDinamicaCard
            fuenteNombre={fuenteNombre}
            campos={camposPostulacion}
            respuestas={respuestasPostulacion}
          />
          <DocumentosRevisionCard
            requeridos={catalogoDocumentos}
            documentos={documentos}
          />
          <ComentariosAprobacionCard />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ValidacionRequisitosCard
            documentosOk={documentosOk}
            diagnosticoOk={diagnosticoOk}
            postulacionOk={postulacionOk}
            datosProyectoOk={datosProyectoOk}
          />
          <AprobacionPanel
            proyectoId={proyectoId}
            puedeAprobar={puedeAprobar}
            yaAprobado={yaAprobado}
          />
          <AlertasActivasPanel />
          <UltimosDocumentosPanel />
        </div>
      </div>
    </div>
  )
}

function getRequirementId(doc: DocumentoAprobacion) {
  if (doc.catalogo_documento_id) return doc.catalogo_documento_id

  const prefix = 'documento_fuente_id:'

  if (doc.observacion?.startsWith(prefix)) {
    return doc.observacion.slice(prefix.length)
  }

  return ''
}

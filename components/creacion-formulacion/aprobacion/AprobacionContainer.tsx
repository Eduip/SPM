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
import ProjectVisualizationCard from '../../ficha-proyecto/ProjectVisualizationCard'
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
  visualization,
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
  visualization?: {
    referenceUrl: string
    generatedUrls: string[]
    referencePrompt: string
    userInstructions: string
    generatedAt: string
  } | null
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

  const diagnosticoOk = Boolean(diagnostico?.problema_central)
  const postulacionOk = Boolean(fuenteNombre)
  const datosProyectoOk = Boolean(proyecto?.nombre && datosGenerales?.descripcion)
  const yaAprobado = proyecto?.estado === 'aprobado'
  const montoTotalPostulacion = calculateBudgetTotal(
    camposPostulacion,
    respuestasPostulacion
  )

  const puedeAprobar =
    !yaAprobado && documentosOk && diagnosticoOk && postulacionOk && datosProyectoOk
  const suggestedVisualizationInstructions = buildVisualizationSuggestion({
    projectName: proyecto?.nombre ?? '',
    description: datosGenerales?.descripcion ?? '',
    problem: diagnostico?.problema_central ?? '',
    location:
      typeof proyecto?.localizacion === 'string' ? proyecto.localizacion : '',
    fundingSource: fuenteNombre,
  })

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
          <ProjectVisualizationCard
            projectId={proyectoId}
            projectName={proyecto?.nombre ?? 'Proyecto'}
            initialVisualization={visualization ?? null}
            suggestedInstructions={suggestedVisualizationInstructions}
          />
          <ResumenProyectoCard
            proyecto={proyecto}
            postulacion={postulacion}
            datosGenerales={datosGenerales}
            fuenteNombre={fuenteNombre}
            montoTotalPostulacion={montoTotalPostulacion}
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

function buildVisualizationSuggestion({
  projectName,
  description,
  problem,
  location,
  fundingSource,
}: {
  projectName: string
  description: string
  problem: string
  location: string
  fundingSource: string
}) {
  const snippets = [
    description.trim(),
    problem.trim(),
  ].filter(Boolean)

  const context = snippets.join(' ').replace(/\s+/g, ' ').trim()

  return [
    `Representar el proyecto "${projectName || 'municipal'}" como una intervención ejecutada y realista sobre la imagen base.`,
    context
      ? `Basarse en esta descripción del proyecto: ${context}`
      : '',
    location ? `Considerar el contexto del lugar: ${location}.` : '',
    fundingSource
      ? `Mantener coherencia con la fuente de financiamiento ${fundingSource}.`
      : '',
    'Mostrar de forma clara las obras, equipamiento, mejoras urbanas, accesibilidad, áreas verdes o infraestructura que se desprendan de la descripción del proyecto, sin inventar elementos ajenos.',
    'Priorizar una propuesta realista, plausible y ordenada, manteniendo la perspectiva y las proporciones del lugar original.',
  ]
    .filter(Boolean)
    .join(' ')
}

function getRequirementId(doc: DocumentoAprobacion) {
  if (doc.catalogo_documento_id) return doc.catalogo_documento_id

  const prefix = 'documento_fuente_id:'

  if (doc.observacion?.startsWith(prefix)) {
    return doc.observacion.slice(prefix.length)
  }

  return ''
}

function calculateBudgetTotal(
  campos: CampoPostulacion[],
  respuestas: RespuestaPostulacion[]
) {
  const presupuestoCampoIds = new Set(
    campos.filter((campo) => campo.tipo === 'presupuesto').map((campo) => campo.id)
  )

  if (presupuestoCampoIds.size === 0) {
    return null
  }

  return respuestas
    .filter((respuesta) => presupuestoCampoIds.has(respuesta.campo_id))
    .reduce((total, respuesta) => total + responseValueToNumber(respuesta), 0)
}

function responseValueToNumber(respuesta: RespuestaPostulacion) {
  if (respuesta.valor_numero !== null && respuesta.valor_numero !== undefined) {
    return Number(respuesta.valor_numero) || 0
  }

  if (respuesta.valor_texto) {
    return parseMoneyValue(respuesta.valor_texto)
  }

  if (typeof respuesta.valor_json === 'number') {
    return respuesta.valor_json
  }

  if (typeof respuesta.valor_json === 'string') {
    return parseMoneyValue(respuesta.valor_json)
  }

  return 0
}

function parseMoneyValue(value: string) {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

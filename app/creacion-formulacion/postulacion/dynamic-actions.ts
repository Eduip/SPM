'use server'

import { createClient } from '../../../lib/supabase-server'
import type { DynamicFieldValue } from '../../../lib/formulacion-types'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import {
  buildActiveInstitutionalContext,
  loadMunicipalAISettings,
} from '../../../lib/ai/municipal-ai-settings'
import {
  getRelevantStrategicChunks,
  listStrategicDocuments,
} from '../../../lib/ai/strategic-documents'
import { getFieldAIMode, type FieldAIMode } from '../../../lib/ai/field-ai-config'

type RespuestaDinamicaPayload = {
  proyecto_id: string
  fuente_id: string
  campo_id: string
  valor_texto: string | null
  valor_numero: number | null
  valor_booleano: boolean | null
  valor_fecha: string | null
  valor_json: DynamicFieldValue
}

type SugerenciaCampoPayload = {
  proyectoId: string
  fuenteId: string
  campoId: string
  tituloCampo: string
  tipo: string
  valorActual?: string
}

type GanttRowContext = {
  component: string
  activity: string
  activeMonths: number[]
}

type StructuredRowFieldContext = {
  id: string
  kind: string
  label: string
  columnHeader: string
  currentValue: string | number | boolean | null
}

type StructuredRowContext = {
  summary: string
  values: Array<{
    label: string
    value: string | number | boolean | null
  }>
}

type SugerenciaFilaGanttPayload = {
  proyectoId: string
  fuenteId: string
  campoId: string
  tituloCampo: string
  componentLabel: string
  currentActivity: string
  previousRows: GanttRowContext[]
  monthCount: number
}

type SugerenciaFilaTablaPayload = {
  proyectoId: string
  fuenteId: string
  campoId: string
  tituloCampo: string
  tipoTabla: string
  rowTitle: string
  currentRowFields: StructuredRowFieldContext[]
  previousRows: StructuredRowContext[]
}

export async function guardarRespuestaDinamica({
  proyectoId,
  fuenteId,
  campoId,
  tipo,
  valor,
}: {
  proyectoId: string
  fuenteId: string
  campoId: string
  tipo: string
  valor: DynamicFieldValue
}) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!authGuard.success) {
    return authGuard
  }

  if (!proyectoId || !fuenteId || !campoId) {
    return { success: false, error: 'Faltan datos para guardar la respuesta.' }
  }

  const { data: proyecto, error: proyectoError } = await supabase
    .from('proyectos')
    .select('id')
    .eq('id', proyectoId)
    .maybeSingle()

  if (proyectoError) {
    return { success: false, error: proyectoError.message }
  }

  if (!proyecto) {
    return { success: false, error: 'No se encontró el proyecto.' }
  }

  const { data: campo, error: campoError } = await supabase
    .from('campos_formulario_fuente')
    .select('id, tipo, fuente_id, visible')
    .eq('id', campoId)
    .eq('fuente_id', fuenteId)
    .eq('visible', true)
    .maybeSingle()

  if (campoError) {
    return { success: false, error: campoError.message }
  }

  if (!campo) {
    return {
      success: false,
      error: 'El campo no pertenece a la fuente de financiamiento seleccionada.',
    }
  }

  const payload: RespuestaDinamicaPayload = {
    proyecto_id: proyectoId,
    fuente_id: fuenteId,
    campo_id: campoId,
    valor_texto: null,
    valor_numero: null,
    valor_booleano: null,
    valor_fecha: null,
    valor_json: null,
  }

  if (tipo === 'texto' || tipo === 'texto_largo' || tipo === 'archivo') {
    payload.valor_texto = valor ? String(valor) : null
  } else if (tipo === 'numero' || tipo === 'plazo' || tipo === 'presupuesto') {
    const numericValue = valor === '' || valueIsNullish(valor) ? null : Number(valor)

    if (numericValue !== null && !Number.isFinite(numericValue)) {
      return { success: false, error: 'Ingresa un valor numérico válido.' }
    }

    payload.valor_numero = numericValue
  } else if (tipo === 'booleano') {
    payload.valor_booleano = Boolean(valor)
  } else if (tipo === 'fecha') {
    payload.valor_fecha = valueIsNullish(valor) || valor === '' ? null : String(valor)
  } else {
    payload.valor_json = valor ?? null
  }

  const { data: existing } = await supabase
    .from('proyecto_postulacion_respuestas')
    .select('id')
    .eq('proyecto_id', proyectoId)
    .eq('campo_id', campoId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('proyecto_postulacion_respuestas')
      .update(payload)
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  const { error } = await supabase
    .from('proyecto_postulacion_respuestas')
    .insert(payload)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function sugerirCampoPostulacionConIA({
  proyectoId,
  fuenteId,
  campoId,
  tituloCampo,
  tipo,
  valorActual = '',
}: SugerenciaCampoPayload) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!authGuard.success) {
    return authGuard
  }

  if (!proyectoId || !fuenteId || !campoId || !tituloCampo.trim()) {
    return { success: false, error: 'Faltan datos para generar la sugerencia IA.' }
  }

  const configuredMode = await getFieldAIMode(
    campoId,
    inferDefaultFieldAIMode(tipo, tituloCampo)
  )

  if (!fieldSupportsAIWithMode(tipo, tituloCampo, configuredMode)) {
    return {
      success: false,
      error: 'Este campo es sensible o estructurado y no admite sugerencia IA.',
    }
  }

  const [
    proyectoRes,
    datosGeneralesRes,
    diagnosticoRes,
    fuenteRes,
    reglasRes,
    aiSettings,
    strategicDocuments,
  ] = await Promise.all([
    supabase
      .from('proyectos')
      .select(`
        id,
        nombre,
        localizacion,
        anio_inicio,
        monto_estimado,
        tipo:tipos_proyecto(nombre),
        categoria:categorias_proyecto(nombre),
        unidad:unidades(nombre)
      `)
      .eq('id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion, poblacion_beneficiaria')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_diagnostico')
      .select('problema_central, justificacion')
      .eq('proyecto_id', proyectoId)
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('fuentes_financiamiento')
      .select('id, nombre, descripcion')
      .eq('id', fuenteId)
      .maybeSingle(),
    supabase
      .from('reglas_validacion_fuente')
      .select('descripcion')
      .eq('fuente_id', fuenteId),
    loadMunicipalAISettings(),
    listStrategicDocuments(),
  ])

  if (proyectoRes.error || !proyectoRes.data) {
    return {
      success: false,
      error: proyectoRes.error?.message || 'No se pudo cargar el proyecto para la sugerencia IA.',
    }
  }

  const proyecto = proyectoRes.data
  const datosGenerales = datosGeneralesRes.data
  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data ?? null
  const fuente = fuenteRes.data
  const institutionalContext = buildActiveInstitutionalContext(aiSettings)
  const strategicContext = getRelevantStrategicChunks({
    documents: strategicDocuments,
    query: [
      proyecto.nombre ?? '',
      tituloCampo,
      fuente?.nombre ?? '',
      fuente?.descripcion ?? '',
      datosGenerales?.descripcion ?? '',
      diagnostico?.problema_central ?? '',
      diagnostico?.justificacion ?? '',
    ].join(' '),
    limit: 4,
  })

  const promptContext = {
    proyecto: {
      nombre: proyecto.nombre ?? '',
      localizacion: proyecto.localizacion ?? '',
      anioInicio: proyecto.anio_inicio ?? '',
      montoEstimado: proyecto.monto_estimado ?? '',
      tipo: extractName(proyecto.tipo),
      categoria: extractName(proyecto.categoria),
      unidad: extractName(proyecto.unidad),
      descripcion: datosGenerales?.descripcion ?? '',
      poblacionBeneficiaria: formatBeneficiarios(
        datosGenerales?.poblacion_beneficiaria ?? null
      ),
    },
    diagnostico: {
      problemaCentral: diagnostico?.problema_central ?? '',
      justificacion: diagnostico?.justificacion ?? '',
    },
    fuente: {
      nombre: fuente?.nombre ?? '',
      descripcion: fuente?.descripcion ?? '',
      reglas: (reglasRes.data ?? []).map((rule) => rule.descripcion).filter(Boolean),
    },
    campo: {
      titulo: tituloCampo,
      tipo,
      valorActual: valorActual.trim(),
    },
    parametrosInstitucionales: institutionalContext,
    documentosEstrategicosRelevantes: strategicContext,
  }

  const fallbackSuggestion = buildLocalPostulacionSuggestion(promptContext)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: true,
      suggestion: fallbackSuggestion,
      mode: 'local',
      notice: 'Se generó una sugerencia local porque falta configurar OPENAI_API_KEY.',
    }
  }

  try {
    const suggestion = await callOpenAIForFieldSuggestion({
      apiKey,
      context: promptContext,
    })

    return {
      success: true,
      suggestion,
      mode: 'ai',
    }
  } catch (error) {
    return {
      success: true,
      suggestion: fallbackSuggestion,
      mode: 'local',
      notice:
        error instanceof Error
          ? `No se pudo consultar el modelo IA. Se generó una sugerencia local: ${sanitizeOpenAIError(error.message)}`
          : 'No se pudo consultar el modelo IA. Se generó una sugerencia local.',
    }
  }
}

export async function sugerirFilaGanttConIA({
  proyectoId,
  fuenteId,
  campoId,
  tituloCampo,
  componentLabel,
  currentActivity,
  previousRows,
  monthCount,
}: SugerenciaFilaGanttPayload) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!authGuard.success) {
    return authGuard
  }

  if (!proyectoId || !fuenteId || !campoId || !tituloCampo.trim()) {
    return { success: false, error: 'Faltan datos para generar la sugerencia IA de la carta Gantt.' }
  }

  const [
    proyectoRes,
    datosGeneralesRes,
    diagnosticoRes,
    fuenteRes,
    reglasRes,
    camposFuenteRes,
    respuestasFuenteRes,
    aiSettings,
    strategicDocuments,
  ] = await Promise.all([
    supabase
      .from('proyectos')
      .select(`
        id,
        nombre,
        localizacion,
        anio_inicio,
        monto_estimado,
        tipo:tipos_proyecto(nombre),
        categoria:categorias_proyecto(nombre),
        unidad:unidades(nombre)
      `)
      .eq('id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion, poblacion_beneficiaria')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_diagnostico')
      .select('problema_central, justificacion')
      .eq('proyecto_id', proyectoId)
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('fuentes_financiamiento')
      .select('id, nombre, descripcion')
      .eq('id', fuenteId)
      .maybeSingle(),
    supabase
      .from('reglas_validacion_fuente')
      .select('descripcion')
      .eq('fuente_id', fuenteId),
    supabase
      .from('campos_formulario_fuente')
      .select('id, nombre, tipo, visible')
      .eq('fuente_id', fuenteId)
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('campo_id, valor_texto')
      .eq('proyecto_id', proyectoId)
      .eq('fuente_id', fuenteId),
    loadMunicipalAISettings(),
    listStrategicDocuments(),
  ])

  if (proyectoRes.error || !proyectoRes.data) {
    return {
      success: false,
      error:
        proyectoRes.error?.message ||
        'No se pudo cargar el proyecto para la sugerencia IA de la carta Gantt.',
    }
  }

  const proyecto = proyectoRes.data
  const datosGenerales = datosGeneralesRes.data
  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data ?? null
  const fuente = fuenteRes.data
  const institutionalContext = buildActiveInstitutionalContext(aiSettings)
  const narrativeFields = new Map(
    (camposFuenteRes.data ?? [])
      .filter((campo) => ['texto', 'texto_largo'].includes(String(campo.tipo)))
      .map((campo) => [campo.id, campo.nombre as string])
  )
  const narrativaPostulacion = (respuestasFuenteRes.data ?? [])
    .map((respuesta) => {
      const title = narrativeFields.get(respuesta.campo_id)
      const value = String(respuesta.valor_texto ?? '').trim()
      if (!title || !value) return ''
      return `${title}: ${value}`
    })
    .filter(Boolean)
    .slice(0, 10)

  const strategicContext = getRelevantStrategicChunks({
    documents: strategicDocuments,
    query: [
      proyecto.nombre ?? '',
      tituloCampo,
      fuente?.nombre ?? '',
      componentLabel ?? '',
      currentActivity ?? '',
      datosGenerales?.descripcion ?? '',
      diagnostico?.problema_central ?? '',
      diagnostico?.justificacion ?? '',
      ...previousRows.map((row) => `${row.component} ${row.activity}`),
    ].join(' '),
    limit: 4,
  })

  const promptContext = {
    proyecto: {
      nombre: proyecto.nombre ?? '',
      localizacion: proyecto.localizacion ?? '',
      anioInicio: proyecto.anio_inicio ?? '',
      montoEstimado: proyecto.monto_estimado ?? '',
      tipo: extractName(proyecto.tipo),
      categoria: extractName(proyecto.categoria),
      unidad: extractName(proyecto.unidad),
      descripcion: datosGenerales?.descripcion ?? '',
      poblacionBeneficiaria: formatBeneficiarios(
        datosGenerales?.poblacion_beneficiaria ?? null
      ),
    },
    diagnostico: {
      problemaCentral: diagnostico?.problema_central ?? '',
      justificacion: diagnostico?.justificacion ?? '',
    },
    fuente: {
      nombre: fuente?.nombre ?? '',
      descripcion: fuente?.descripcion ?? '',
      reglas: (reglasRes.data ?? []).map((rule) => rule.descripcion).filter(Boolean),
    },
    cartaGantt: {
      titulo: tituloCampo,
      componenteActual: componentLabel,
      actividadActual: currentActivity.trim(),
      filasAnteriores: previousRows,
      cantidadMeses: monthCount,
    },
    postulacionNarrativaActual: narrativaPostulacion,
    parametrosInstitucionales: institutionalContext,
    documentosEstrategicosRelevantes: strategicContext,
  }

  const fallbackSuggestion = buildLocalGanttSuggestion(promptContext)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: true,
      ...fallbackSuggestion,
      mode: 'local',
      notice: 'Se generó una sugerencia local porque falta configurar OPENAI_API_KEY.',
    }
  }

  try {
    const suggestion = await callOpenAIForGanttSuggestion({
      apiKey,
      context: promptContext,
    })

    return {
      success: true,
      ...suggestion,
      mode: 'ai',
    }
  } catch (error) {
    return {
      success: true,
      ...fallbackSuggestion,
      mode: 'local',
      notice:
        error instanceof Error
          ? `No se pudo consultar el modelo IA. Se generó una sugerencia local: ${sanitizeOpenAIError(error.message)}`
          : 'No se pudo consultar el modelo IA. Se generó una sugerencia local.',
    }
  }
}

export async function sugerirFilaTablaConIA({
  proyectoId,
  fuenteId,
  campoId,
  tituloCampo,
  tipoTabla,
  rowTitle,
  currentRowFields,
  previousRows,
}: SugerenciaFilaTablaPayload) {
  const supabase = await createClient()
  const authGuard = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!authGuard.success) {
    return authGuard
  }

  if (!proyectoId || !fuenteId || !campoId || !tituloCampo.trim()) {
    return { success: false, error: 'Faltan datos para generar la sugerencia IA de la tabla.' }
  }

  const [
    proyectoRes,
    datosGeneralesRes,
    diagnosticoRes,
    fuenteRes,
    reglasRes,
    camposFuenteRes,
    respuestasFuenteRes,
    aiSettings,
    strategicDocuments,
  ] = await Promise.all([
    supabase
      .from('proyectos')
      .select(`
        id,
        nombre,
        localizacion,
        anio_inicio,
        monto_estimado,
        tipo:tipos_proyecto(nombre),
        categoria:categorias_proyecto(nombre),
        unidad:unidades(nombre)
      `)
      .eq('id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion, poblacion_beneficiaria')
      .eq('proyecto_id', proyectoId)
      .maybeSingle(),
    supabase
      .from('proyecto_diagnostico')
      .select('problema_central, justificacion')
      .eq('proyecto_id', proyectoId)
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('fuentes_financiamiento')
      .select('id, nombre, descripcion')
      .eq('id', fuenteId)
      .maybeSingle(),
    supabase
      .from('reglas_validacion_fuente')
      .select('descripcion')
      .eq('fuente_id', fuenteId),
    supabase
      .from('campos_formulario_fuente')
      .select('id, nombre, tipo, visible')
      .eq('fuente_id', fuenteId)
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('campo_id, valor_texto')
      .eq('proyecto_id', proyectoId)
      .eq('fuente_id', fuenteId),
    loadMunicipalAISettings(),
    listStrategicDocuments(),
  ])

  if (proyectoRes.error || !proyectoRes.data) {
    return {
      success: false,
      error:
        proyectoRes.error?.message ||
        'No se pudo cargar el proyecto para la sugerencia IA de la tabla.',
    }
  }

  const proyecto = proyectoRes.data
  const datosGenerales = datosGeneralesRes.data
  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data ?? null
  const fuente = fuenteRes.data
  const institutionalContext = buildActiveInstitutionalContext(aiSettings)
  const narrativeFields = new Map(
    (camposFuenteRes.data ?? [])
      .filter((campo) => ['texto', 'texto_largo'].includes(String(campo.tipo)))
      .map((campo) => [campo.id, campo.nombre as string])
  )
  const narrativaPostulacion = (respuestasFuenteRes.data ?? [])
    .map((respuesta) => {
      const title = narrativeFields.get(respuesta.campo_id)
      const value = String(respuesta.valor_texto ?? '').trim()
      if (!title || !value) return ''
      return `${title}: ${value}`
    })
    .filter(Boolean)
    .slice(0, 10)

  const strategicContext = getRelevantStrategicChunks({
    documents: strategicDocuments,
    query: [
      proyecto.nombre ?? '',
      tituloCampo,
      fuente?.nombre ?? '',
      rowTitle,
      ...currentRowFields.map((field) => `${field.columnHeader} ${field.label}`),
      ...previousRows.map((row) => row.summary),
      datosGenerales?.descripcion ?? '',
      diagnostico?.problema_central ?? '',
      diagnostico?.justificacion ?? '',
    ].join(' '),
    limit: 4,
  })

  const promptContext = {
    proyecto: {
      nombre: proyecto.nombre ?? '',
      localizacion: proyecto.localizacion ?? '',
      anioInicio: proyecto.anio_inicio ?? '',
      montoEstimado: proyecto.monto_estimado ?? '',
      tipo: extractName(proyecto.tipo),
      categoria: extractName(proyecto.categoria),
      unidad: extractName(proyecto.unidad),
      descripcion: datosGenerales?.descripcion ?? '',
      poblacionBeneficiaria: formatBeneficiarios(
        datosGenerales?.poblacion_beneficiaria ?? null
      ),
    },
    diagnostico: {
      problemaCentral: diagnostico?.problema_central ?? '',
      justificacion: diagnostico?.justificacion ?? '',
    },
    fuente: {
      nombre: fuente?.nombre ?? '',
      descripcion: fuente?.descripcion ?? '',
      reglas: (reglasRes.data ?? []).map((rule) => rule.descripcion).filter(Boolean),
    },
    tabla: {
      titulo: tituloCampo,
      tipo: tipoTabla,
      filaActual: {
        titulo: rowTitle,
        campos: currentRowFields,
      },
      filasAnteriores: previousRows,
    },
    postulacionNarrativaActual: narrativaPostulacion,
    parametrosInstitucionales: institutionalContext,
    documentosEstrategicosRelevantes: strategicContext,
  }

  const fallbackSuggestion = buildLocalStructuredRowSuggestion(promptContext)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: true,
      values: fallbackSuggestion,
      mode: 'local',
      notice: 'Se generó una sugerencia local porque falta configurar OPENAI_API_KEY.',
    }
  }

  try {
    const values = await callOpenAIForStructuredRowSuggestion({
      apiKey,
      context: promptContext,
      fields: currentRowFields,
    })

    return {
      success: true,
      values,
      mode: 'ai',
    }
  } catch (error) {
    return {
      success: true,
      values: fallbackSuggestion,
      mode: 'local',
      notice:
        error instanceof Error
          ? `No se pudo consultar el modelo IA. Se generó una sugerencia local: ${sanitizeOpenAIError(error.message)}`
          : 'No se pudo consultar el modelo IA. Se generó una sugerencia local.',
    }
  }
}

function valueIsNullish(value: unknown) {
  return value === null || value === undefined
}

function fieldSupportsAIWithMode(tipo: string, title: string, mode: FieldAIMode) {
  if (mode === 'blocked') return false
  if (mode === 'suggest' || mode === 'improve_only') {
    return ['texto', 'texto_largo'].includes(tipo)
  }

  const normalizedTitle = normalizeText(title)

  if (!['texto', 'texto_largo'].includes(tipo)) return false

  const blockedTerms = [
    'bip',
    'codigo',
    'código',
    'rut',
    'folio',
    'resolucion',
    'resolución',
    'identificador',
    'id ',
    'n°',
    'numero de cuenta',
    'cartola',
  ]

  return !blockedTerms.some((term) => normalizedTitle.includes(normalizeText(term)))
}

function inferDefaultFieldAIMode(tipo: string, title: string): FieldAIMode {
  return fieldSupportsAIWithHeuristic(tipo, title) ? 'suggest' : 'blocked'
}

function fieldSupportsAIWithHeuristic(tipo: string, title: string) {
  const normalizedTitle = normalizeText(title)

  if (!['texto', 'texto_largo'].includes(tipo)) return false

  const blockedTerms = [
    'bip',
    'codigo',
    'código',
    'rut',
    'folio',
    'resolucion',
    'resolución',
    'identificador',
    'id ',
    'n°',
    'numero de cuenta',
    'cartola',
  ]

  return !blockedTerms.some((term) => normalizedTitle.includes(normalizeText(term)))
}

async function callOpenAIForFieldSuggestion({
  apiKey,
  context,
}: {
  apiKey: string
  context: unknown
}) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en formulación de proyectos municipales en Chile. Tu tarea es proponer solo el contenido para un campo puntual de un formulario de postulación. Responde solo con el texto final sugerido para ese campo, sin títulos, sin viñetas introductorias, sin markdown, sin comillas y sin explicar tu razonamiento. Usa un tono técnico, claro y alineado con el nombre del campo, la fuente de financiamiento, el diagnóstico del proyecto y los parámetros institucionales. Si el campo es narrativo, redacta un contenido completo y útil; si ya existe un valor actual, mejóralo y hazlo más sólido.',
        },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const suggestion = data.choices?.[0]?.message?.content?.trim()
  if (!suggestion) {
    throw new Error('El modelo no devolvió una sugerencia.')
  }

  return suggestion.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '').trim()
}

async function callOpenAIForGanttSuggestion({
  apiKey,
  context,
}: {
  apiKey: string
  context: unknown
}) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en formulación de proyectos municipales en Chile. Tu tarea es proponer una sola fila para una carta Gantt. Debes considerar el contexto del proyecto, la narrativa ya redactada, el componente actual y las filas anteriores para no repetir actividades. Responde solo en JSON válido con esta forma exacta: {"activityText":"...","activeMonths":[1,2,3]}. activityText debe ser una redacción técnica y concreta de la actividad. activeMonths debe listar los meses en que corresponde ejecutar la actividad, con números enteros entre 1 y la cantidad máxima de meses.',
        },
        {
          role: 'user',
          content: JSON.stringify(context, null, 2),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('El modelo no devolvió una sugerencia para la carta Gantt.')
  }

  const parsed = parseJsonObject(content)
  const activityText = String(parsed.activityText ?? '').trim()
  const activeMonths = Array.isArray(parsed.activeMonths)
    ? parsed.activeMonths
        .map((month) => Number(month))
        .filter((month) => Number.isInteger(month) && month > 0)
    : []

  if (!activityText) {
    throw new Error('La respuesta IA no incluyó un texto de actividad válido.')
  }

  return {
    activityText,
    activeMonths,
  }
}

async function callOpenAIForStructuredRowSuggestion({
  apiKey,
  context,
  fields,
}: {
  apiKey: string
  context: unknown
  fields: StructuredRowFieldContext[]
}) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en formulación de proyectos municipales en Chile. Tu tarea es completar una sola fila de una tabla estructurada. Debes considerar el contexto del proyecto, la narrativa ya redactada y las filas anteriores para mantener coherencia. Responde solo en JSON válido con esta forma exacta: {"values":{"ID_CAMPO_1":"texto","ID_CAMPO_2":123}}. Usa exactamente los IDs entregados. Para input_text e input_textarea devuelve texto. Para input_number devuelve números. No inventes campos no incluidos.',
        },
        {
          role: 'user',
          content: JSON.stringify({ context, fields }, null, 2),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('El modelo no devolvió una sugerencia para la fila de tabla.')
  }

  const parsed = parseJsonObject(content)
  const rawValues =
    parsed && typeof parsed.values === 'object' && parsed.values !== null
      ? (parsed.values as Record<string, unknown>)
      : {}

  const normalizedEntries = fields.map((field) => {
    const raw = rawValues[field.id]

    if (field.kind === 'input_number') {
      const numeric = Number(raw)
      return [field.id, Number.isFinite(numeric) ? numeric : 0] as const
    }

    return [field.id, String(raw ?? '').trim()] as const
  })

  return Object.fromEntries(normalizedEntries)
}

function buildLocalPostulacionSuggestion(context: {
  proyecto: {
    nombre: string
    localizacion: string
    tipo: string
    descripcion: string
  }
  diagnostico: {
    problemaCentral: string
    justificacion: string
  }
  fuente: {
    nombre: string
    descripcion: string
    reglas: string[]
  }
  campo: {
    titulo: string
    valorActual: string
  }
  parametrosInstitucionales: ReturnType<typeof buildActiveInstitutionalContext>
  documentosEstrategicosRelevantes: Array<{
    documentName: string
    title: string
    content: string
  }>
}) {
  const title = normalizeText(context.campo.titulo)
  const sourceLabel = context.fuente.nombre || 'la fuente seleccionada'
  const projectLabel = context.proyecto.nombre || 'el proyecto'
  const diagnosis = context.diagnostico.problemaCentral || context.diagnostico.justificacion
  const docsSupport = context.documentosEstrategicosRelevantes[0]
    ? ` Además, la formulación puede vincularse con ${context.documentosEstrategicosRelevantes[0].documentName}, especialmente con la sección ${context.documentosEstrategicosRelevantes[0].title}.`
    : ''
  const priorities = context.parametrosInstitucionales.municipalPriorities
    ? ` La redacción debe dialogar con prioridades institucionales como ${context.parametrosInstitucionales.municipalPriorities}.`
    : ''

  if (title.includes('objetivo')) {
    return `El proyecto ${projectLabel} busca dar respuesta a la problemática identificada en el territorio mediante una intervención orientada a mejorar las condiciones de funcionamiento, acceso y pertinencia de la infraestructura o servicio asociado, fortaleciendo su contribución al desarrollo local y a la atención efectiva de las necesidades detectadas.${priorities}${docsSupport}`
  }

  if (title.includes('impacto') || title.includes('resultado')) {
    return `Se espera que la iniciativa genere impactos positivos en términos de cobertura, calidad de atención y fortalecimiento de la respuesta municipal, contribuyendo a resolver de manera más oportuna la necesidad detectada y mejorando las condiciones para la comunidad beneficiaria. La propuesta permitirá avanzar hacia una solución más sostenible, pertinente y alineada con el enfoque de ${sourceLabel}.${docsSupport}`
  }

  if (title.includes('descripcion') || title.includes('descripción') || title.includes('resumen')) {
    return `El proyecto ${projectLabel} se orienta a enfrentar ${diagnosis || 'una necesidad prioritaria del territorio'} mediante una solución técnicamente consistente, pertinente para la comuna y alineada con los objetivos de ${sourceLabel}. La intervención busca fortalecer las condiciones actuales del territorio, mejorar el acceso o funcionamiento del servicio involucrado y entregar una respuesta más efectiva para la población objetivo.${priorities}${docsSupport}`
  }

  if (title.includes('justificacion') || title.includes('justificación') || title.includes('fundament')) {
    return `La postulación se fundamenta en la existencia de una necesidad prioritaria que requiere una intervención pública pertinente y oportuna. En ese sentido, la iniciativa permite abordar brechas detectadas en el territorio, mejorar las condiciones de operación y aumentar la capacidad de respuesta municipal frente a la demanda existente. Asimismo, su desarrollo se alinea con los propósitos de ${sourceLabel} y con la necesidad de fortalecer una cartera de proyectos con impacto real en la comuna.${priorities}${docsSupport}`
  }

  return `La información propuesta para el campo "${context.campo.titulo}" debe enfocarse en explicar con claridad la pertinencia del proyecto, su relación con la necesidad detectada y su contribución al desarrollo local. En ese marco, ${projectLabel} constituye una iniciativa técnicamente justificable, coherente con los objetivos de ${sourceLabel} y capaz de generar una mejora concreta para la comunidad beneficiaria.${priorities}${docsSupport}`
}

function buildLocalGanttSuggestion(context: {
  proyecto: {
    nombre: string
    descripcion: string
  }
  diagnostico: {
    problemaCentral: string
    justificacion: string
  }
  fuente: {
    nombre: string
  }
  cartaGantt: {
    componenteActual: string
    actividadActual: string
    filasAnteriores: GanttRowContext[]
    cantidadMeses: number
  }
  postulacionNarrativaActual: string[]
}) {
  const sequenceTemplates = [
    'Planificación y coordinación inicial de la intervención',
    'Preparación técnica y logística para la ejecución de la actividad',
    'Ejecución en terreno de la actividad comprometida',
    'Sistematización de resultados y consolidación de antecedentes',
    'Cierre técnico, validación y seguimiento de la actividad ejecutada',
  ]

  const previousRows = context.cartaGantt.filasAnteriores.filter((row) => row.activity.trim().length > 0)
  const previousMonths = previousRows.flatMap((row) => row.activeMonths)
  const lastMonth = previousMonths.length ? Math.max(...previousMonths) : 0
  const startMonth = Math.min(Math.max(lastMonth + 1, 1), Math.max(context.cartaGantt.cantidadMeses, 1))
  const endMonth = Math.min(startMonth + 1, Math.max(context.cartaGantt.cantidadMeses, 1))
  const template =
    context.cartaGantt.actividadActual.trim() ||
    sequenceTemplates[Math.min(previousRows.length, sequenceTemplates.length - 1)]
  const diagnosis = context.diagnostico.problemaCentral || context.diagnostico.justificacion
  const support = context.postulacionNarrativaActual[0]
    ? `, manteniendo coherencia con lo ya formulado en ${context.postulacionNarrativaActual[0].split(':')[0]}`
    : ''

  return {
    activityText: `${template} para ${context.cartaGantt.componenteActual || 'el componente definido'}, abordando ${diagnosis || 'la necesidad detectada del proyecto'}${support}.`,
    activeMonths: startMonth === endMonth ? [startMonth] : [startMonth, endMonth],
  }
}

function buildLocalStructuredRowSuggestion(context: {
  diagnostico: { problemaCentral: string; justificacion: string }
  fuente: { nombre: string }
  tabla: {
    titulo: string
    tipo: string
    filaActual: {
      titulo: string
      campos: StructuredRowFieldContext[]
    }
    filasAnteriores: StructuredRowContext[]
  }
}) {
  const diagnosis = context.diagnostico.problemaCentral || context.diagnostico.justificacion
  const previousCount = context.tabla.filasAnteriores.length

  return Object.fromEntries(
    context.tabla.filaActual.campos.map((field, index) => {
      if (field.kind === 'input_number') {
        return [field.id, Math.max(1, previousCount + index + 1)]
      }

      return [
        field.id,
        `${field.label || field.columnHeader}: propuesta referencial vinculada a ${diagnosis || 'la necesidad detectada'} y coherente con ${context.fuente.nombre || 'la fuente de financiamiento seleccionada'}.`,
      ]
    })
  )
}

function extractName(
  value: { nombre?: string | null } | { nombre?: string | null }[] | null | undefined
) {
  const item = Array.isArray(value) ? value[0] : value
  return item?.nombre ?? ''
}

function formatBeneficiarios(value: unknown) {
  if (!Array.isArray(value)) return ''

  return value
    .map((item) => {
      const row = item as { group?: unknown; quantity?: unknown }
      const group = String(row.group ?? '').trim()
      const quantity = String(row.quantity ?? '').trim()
      if (!group && !quantity) return ''
      return quantity ? `${group}: ${quantity}` : group
    })
    .filter(Boolean)
    .join('; ')
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function sanitizeOpenAIError(message: string) {
  if (message.includes('insufficient_quota')) {
    return 'la cuenta API no tiene cuota disponible'
  }

  return message.slice(0, 240)
}

function parseJsonObject(content: string) {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned

  return JSON.parse(candidate) as Record<string, unknown>
}

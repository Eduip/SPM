'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import {
  buildActiveInstitutionalContext,
  loadMunicipalAISettings,
} from '../../../lib/ai/municipal-ai-settings'
import {
  getRelevantStrategicChunks,
  listStrategicDocuments,
} from '../../../lib/ai/strategic-documents'

type DiagnosticoItemPayload = {
  id: string
  title: string
  description: string
}

type SaveDiagnosticoPayload = {
  proyectoId: string
  problemaCentral: string
  justificacion: string
  causas: DiagnosticoItemPayload[]
  consecuencias: DiagnosticoItemPayload[]
}

type GenerateDiagnosticoDraftPayload = {
  proyectoId: string
  problemaCentralActual?: string
  justificacionActual?: string
}

export async function saveDiagnosticoData(payload: SaveDiagnosticoPayload) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!access.success) {
    return access
  }

  if (!payload.proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  if (!payload.problemaCentral.trim()) {
    return {
      success: false,
      error: 'El problema central es obligatorio.',
    }
  }

  if (!payload.justificacion.trim()) {
    return {
      success: false,
      error: 'La justificación del proyecto es obligatoria.',
    }
  }

  const causasValidas = payload.causas.filter(
    (item) => item.title.trim() !== '' || item.description.trim() !== ''
  )

  const consecuenciasValidas = payload.consecuencias.filter(
    (item) => item.title.trim() !== '' || item.description.trim() !== ''
  )

  if (causasValidas.length === 0) {
    return {
      success: false,
      error: 'Debes ingresar al menos una causa.',
    }
  }

  if (consecuenciasValidas.length === 0) {
    return {
      success: false,
      error: 'Debes ingresar al menos una consecuencia.',
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', access.userId)
    .maybeSingle()

  if (!profile) {
    return {
      success: false,
      error: 'El usuario no tiene perfil asociado.',
    }
  }

  const { data: existingDiagnostico } = await supabase
    .from('proyecto_diagnostico')
    .select('id')
    .eq('proyecto_id', payload.proyectoId)
    .order('updated_at', { ascending: false })
    .limit(1)

  let diagnosticoId = existingDiagnostico?.[0]?.id ?? ''

  if (diagnosticoId) {
    const { error: updateDiagnosticoError } = await supabase
      .from('proyecto_diagnostico')
      .update({
        problema_central: payload.problemaCentral,
        justificacion: payload.justificacion,
      })
      .eq('id', diagnosticoId)

    if (updateDiagnosticoError) {
      return {
        success: false,
        error:
          updateDiagnosticoError.message ||
          'No se pudo actualizar el diagnóstico.',
      }
    }

    await supabase.from('diagnostico_causas').delete().eq('diagnostico_id', diagnosticoId)
    await supabase
      .from('diagnostico_consecuencias')
      .delete()
      .eq('diagnostico_id', diagnosticoId)
  } else {
    const { data: nuevoDiagnostico, error: insertDiagnosticoError } = await supabase
      .from('proyecto_diagnostico')
      .insert({
        proyecto_id: payload.proyectoId,
        problema_central: payload.problemaCentral,
        justificacion: payload.justificacion,
      })
      .select('id')
      .single()

    if (insertDiagnosticoError || !nuevoDiagnostico) {
      return {
        success: false,
        error:
          insertDiagnosticoError?.message ||
          'No se pudo crear el diagnóstico.',
      }
    }

    diagnosticoId = nuevoDiagnostico.id
  }

  const causasToInsert = causasValidas.map((item) => ({
    diagnostico_id: diagnosticoId,
    titulo: item.title,
    descripcion: item.description,
  }))

  const consecuenciasToInsert = consecuenciasValidas.map((item) => ({
    diagnostico_id: diagnosticoId,
    titulo: item.title,
    descripcion: item.description,
  }))

  const { error: causasError } = await supabase
    .from('diagnostico_causas')
    .insert(causasToInsert)

  if (causasError) {
    return {
      success: false,
      error: causasError.message || 'No se pudieron guardar las causas.',
    }
  }

  const { error: consecuenciasError } = await supabase
    .from('diagnostico_consecuencias')
    .insert(consecuenciasToInsert)

  if (consecuenciasError) {
    return {
      success: false,
      error:
        consecuenciasError.message ||
        'No se pudieron guardar las consecuencias.',
    }
  }

  const { error: updateProyectoError } = await supabase
    .from('proyectos')
    .update({
      etapa_formulacion_actual: 2,
      porcentaje_formulacion: 40,
      updated_by: profile.id,
    })
    .eq('id', payload.proyectoId)

  if (updateProyectoError) {
    return {
      success: false,
      error:
        updateProyectoError.message ||
        'Se guardó el diagnóstico, pero no se pudo actualizar el proyecto.',
    }
  }

  const { error: historialError } = await supabase.rpc(
    'registrar_evento_historial',
    {
      p_entidad: 'proyecto',
      p_entidad_id: payload.proyectoId,
      p_accion: 'editar',
      p_descripcion: 'Diagnóstico guardado/actualizado correctamente.',
      p_usuario_id: profile.id,
      p_metadata: {
        etapa: 'diagnostico',
        diagnostico_id: diagnosticoId,
      },
    }
  )

  if (historialError) {
    return {
      success: false,
      error:
        historialError.message ||
        'El diagnóstico se guardó, pero falló el registro en historial.',
    }
  }

  revalidatePath('/creacion-formulacion/diagnostico')
  revalidatePath('/creacion-formulacion/postulacion')

  return {
    success: true,
    diagnosticoId,
  }
}

export async function generateDiagnosticoDraft(
  payload: GenerateDiagnosticoDraftPayload
) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!access.success) {
    return access
  }

  if (!payload.proyectoId) {
    return {
      success: false,
      error: 'No se recibió el proyectoId.',
    }
  }

  const [{ data: proyecto, error: proyectoError }, { data: datosGenerales, error: datosError }] =
    await Promise.all([
      supabase
        .from('proyectos')
        .select(
          `
          id,
          nombre,
          localizacion,
          anio_inicio,
          monto_estimado,
          estado,
          tipo:tipos_proyecto(nombre),
          categoria:categorias_proyecto(nombre),
          unidad:unidades(nombre),
          responsable:profiles!proyectos_responsable_id_fkey(nombre_completo)
        `
        )
        .eq('id', payload.proyectoId)
        .maybeSingle(),
      supabase
        .from('proyecto_datos_generales')
        .select('descripcion, poblacion_beneficiaria')
        .eq('proyecto_id', payload.proyectoId)
        .maybeSingle(),
    ])

  if (proyectoError || !proyecto) {
    return {
      success: false,
      error: proyectoError?.message || 'No se pudo cargar el proyecto.',
    }
  }

  if (datosError) {
    return {
      success: false,
      error: datosError.message || 'No se pudo cargar la información general del proyecto.',
    }
  }

  if (proyecto.estado === 'aprobado') {
    return {
      success: false,
      error: 'El proyecto ya está aprobado y no admite nuevas sugerencias de redacción.',
    }
  }

  const context = buildDiagnosticoPromptContext({
    proyecto,
    datosGenerales,
    problemaCentralActual: payload.problemaCentralActual ?? '',
    justificacionActual: payload.justificacionActual ?? '',
    aiSettings: buildActiveInstitutionalContext(await loadMunicipalAISettings()),
    strategicContext: getRelevantStrategicChunks({
      documents: await listStrategicDocuments(),
      query: [
        proyecto.nombre ?? '',
        proyecto.localizacion ?? '',
        datosGenerales?.descripcion ?? '',
        payload.problemaCentralActual ?? '',
        payload.justificacionActual ?? '',
      ].join(' '),
      limit: 5,
    }),
  })
  const fallbackDraft = buildLocalDiagnosticoDraft(context)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: true,
      draft: fallbackDraft,
      mode: 'local',
      notice:
        'Se generó un borrador local porque falta configurar OPENAI_API_KEY.',
    }
  }

  try {
    const draft = await callOpenAIDiagnosticoDraft({
      apiKey,
      context,
    })

    return {
      success: true,
      draft,
      mode: 'ai',
    }
  } catch (error) {
    return {
      success: true,
      draft: fallbackDraft,
      mode: 'local',
      notice:
        error instanceof Error
          ? `No se pudo consultar el modelo IA. Se generó un borrador local: ${sanitizeOpenAIError(error.message)}`
          : 'No se pudo consultar el modelo IA. Se generó un borrador local.',
    }
  }
}

export async function uploadDiagnosticoDocumento(formData: FormData) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  const proyectoId = String(formData.get('proyectoId') || '')
  const file = formData.get('file') as File | null

  if (!proyectoId) {
    return { success: false, error: 'Falta el proyectoId.' }
  }

  if (!file) {
    return { success: false, error: 'Debes seleccionar un archivo.' }
  }

  if (!access.success) {
    return access
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre_completo')
    .eq('id', access.userId)
    .maybeSingle()

  if (!profile) {
    return { success: false, error: 'El usuario no tiene perfil asociado.' }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeFileName = file.name.replace(/\s+/g, '-')
  const path = `${proyectoId}/diagnostico/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from('documentos-proyectos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message || 'No se pudo subir el archivo al storage.',
    }
  }

  const fechaSubida = new Date().toISOString()
  const documentPayload = {
    proyecto_id: proyectoId,
    catalogo_documento_id: null,
    nombre: file.name,
    nombre_archivo: file.name,
    ruta_storage: path,
    bucket: 'documentos-proyectos',
    tipo_documento: 'Respaldo diagnóstico',
    etapa: 'diagnostico',
    extension: file.name.split('.').pop() || null,
    tamano_bytes: file.size,
    mime_type: file.type,
    subido_por: profile.id,
    fecha_subida: fechaSubida,
    obligatorio: false,
    estado_revision: 'subido',
    porcentaje_validacion: 100,
    observacion: null,
  }

  const { data: savedDocument, error: saveError } = await supabase
    .from('documentos_proyecto')
    .insert(documentPayload)
    .select('id')
    .single()

  if (saveError || !savedDocument) {
    return {
      success: false,
      error:
        saveError?.message ||
        'No se pudo registrar el documento en la base de datos.',
    }
  }

  const documento = {
    id: savedDocument.id,
    ...documentPayload,
    profile: [{ nombre_completo: profile.nombre_completo ?? 'Usuario' }],
  }

  await supabase.rpc('registrar_evento_historial', {
    p_entidad: 'documento',
    p_entidad_id: proyectoId,
    p_accion: 'subir_documento',
    p_descripcion: `Se cargó el respaldo de diagnóstico: ${file.name}`,
    p_usuario_id: profile.id,
    p_metadata: {
      etapa: 'diagnostico',
      nombre_archivo: file.name,
    },
  })

  revalidatePath('/creacion-formulacion/diagnostico')

  return { success: true, documento }
}

function buildDiagnosticoPromptContext({
  proyecto,
  datosGenerales,
  problemaCentralActual,
  justificacionActual,
  aiSettings,
  strategicContext,
}: {
  proyecto: {
    id: string
    nombre?: string | null
    localizacion?: string | null
    anio_inicio?: number | null
    monto_estimado?: number | null
    estado?: string | null
    tipo?: { nombre?: string | null } | { nombre?: string | null }[] | null
    categoria?: { nombre?: string | null } | { nombre?: string | null }[] | null
    unidad?: { nombre?: string | null } | { nombre?: string | null }[] | null
    responsable?:
      | { nombre_completo?: string | null }
      | { nombre_completo?: string | null }[]
      | null
  }
  datosGenerales: {
    descripcion?: string | null
    poblacion_beneficiaria?: unknown
  } | null
  problemaCentralActual: string
  justificacionActual: string
  aiSettings: ReturnType<typeof buildActiveInstitutionalContext>
  strategicContext: Array<{
    documentName: string
    title: string
    content: string
    pageStart: number
    pageEnd: number
    score: number
  }>
}) {
  return {
    proyectoId: proyecto.id,
    nombre: proyecto.nombre ?? '',
    tipo: extractNamedValue(proyecto.tipo),
    categoria: extractNamedValue(proyecto.categoria),
    unidad: extractNamedValue(proyecto.unidad),
    responsable: extractResponsibleValue(proyecto.responsable),
    localizacion: proyecto.localizacion ?? '',
    anioInicio: proyecto.anio_inicio ?? null,
    montoEstimado: proyecto.monto_estimado ?? null,
    descripcion: datosGenerales?.descripcion ?? '',
    poblacionBeneficiaria: formatBeneficiarios(
      datosGenerales?.poblacion_beneficiaria ?? null
    ),
    problemaCentralActual,
    justificacionActual,
    parametrosInstitucionales: aiSettings,
    documentosEstrategicosRelevantes: strategicContext,
  }
}

function buildLocalDiagnosticoDraft(
  context: ReturnType<typeof buildDiagnosticoPromptContext>
) {
  const projectLabel = context.nombre || 'el proyecto'
  const descripcion = context.descripcion || `la iniciativa ${projectLabel}`
  const poblacion = context.poblacionBeneficiaria || 'la comunidad usuaria y beneficiaria'
  const localizacion = context.localizacion || 'la comuna'
  const tipo = context.tipo || 'iniciativa municipal'
  const categoria = context.categoria || 'intervención prioritaria'
  const alignmentParagraph = buildInstitutionalAlignmentParagraph(
    context.parametrosInstitucionales
  )
  const strategicClosing = buildStrategicClosing(context.parametrosInstitucionales)
  const keywordsSentence = buildKeywordsSentence(context.parametrosInstitucionales.keywords)
  const strategicDocsParagraph = buildStrategicDocumentsParagraph(
    context.documentosEstrategicosRelevantes
  )

  return {
    problemaCentral:
      context.problemaCentralActual.trim() ||
      `En ${localizacion} se identifica una brecha significativa asociada a ${descripcion}, la cual afecta de manera directa la calidad, oportunidad y cobertura de la respuesta municipal frente a una necesidad prioritaria de la comunidad. La situación actual evidencia que el ${tipo.toLowerCase()} proyectado aún no cuenta con las condiciones suficientes para responder de forma adecuada a la demanda existente, generando restricciones para ${poblacion}. Esta problemática no solo se expresa como una carencia puntual, sino como una condición estructural que limita el funcionamiento esperado del territorio y reduce la capacidad de alcanzar estándares adecuados en materia de ${categoria.toLowerCase()}.${alignmentParagraph ? ` ${alignmentParagraph}` : ''}${strategicDocsParagraph ? ` ${strategicDocsParagraph}` : ''}`,
    justificacion:
      context.justificacionActual.trim() ||
      `El proyecto se justifica porque aborda una necesidad prioritaria detectada en ${localizacion}, interviniendo sobre factores que hoy afectan de forma directa a ${poblacion}. A través de esta iniciativa será posible reducir brechas de acceso, mejorar condiciones de operación y fortalecer la capacidad del municipio para entregar una respuesta más eficiente, pertinente y sostenida en el tiempo.${keywordsSentence}\n\nDesde una perspectiva de desarrollo local, la ejecución del proyecto permitirá generar impactos positivos en términos de calidad de vida, funcionalidad territorial y mejor aprovechamiento de la infraestructura o servicio asociado. Asimismo, contribuirá a ordenar la inversión pública sobre una problemática concreta, entregando una solución con mayor consistencia técnica y una mejor proyección de beneficios para la comunidad usuaria.${strategicClosing ? ` ${strategicClosing}` : ''}`,
    causas: [
      {
        title: 'Infraestructura o condiciones actuales insuficientes',
        description:
          'Las condiciones actuales no responden adecuadamente a la demanda detectada en el territorio, presentando limitaciones de capacidad, estándar o cobertura que impiden satisfacer de manera oportuna la necesidad identificada.',
      },
      {
        title: 'Limitaciones operativas para atender la necesidad',
        description:
          'Los recursos disponibles, tanto físicos como de gestión, resultan insuficientes para entregar una solución continua y sostenible, lo que obliga a operar con respuestas parciales o transitorias frente al problema.',
      },
      {
        title: 'Déficit acumulado en cobertura o calidad del servicio',
        description:
          'La ausencia de una intervención oportuna ha profundizado brechas preexistentes en cobertura, calidad o acceso, afectando de manera directa a la población beneficiaria y aumentando la presión sobre la gestión municipal.',
      },
    ],
    consecuencias: [
      {
        title: 'Persistencia del problema en la comunidad',
        description:
          'La problemática continuará afectando a la población objetivo, manteniendo condiciones deficientes para el desarrollo normal de sus actividades y limitando el aprovechamiento de oportunidades en el territorio.',
      },
      {
        title: 'Mayor presión sobre la gestión municipal',
        description:
          'El municipio deberá seguir enfrentando la demanda con herramientas insuficientes, incrementando los costos de gestión, el uso de soluciones transitorias y la dificultad para responder con criterios de eficiencia y oportunidad.',
      },
      {
        title: 'Pérdida de oportunidades de desarrollo local',
        description:
          'La falta de solución reducirá impactos positivos esperados en bienestar, acceso, articulación territorial y fortalecimiento comunitario, postergando beneficios que podrían generarse mediante una inversión pública pertinente.',
      },
    ],
  }
}

async function callOpenAIDiagnosticoDraft({
  apiKey,
  context,
}: {
  apiKey: string
  context: ReturnType<typeof buildDiagnosticoPromptContext>
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
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en formulación de proyectos municipales en Chile. Redacta en español formal, técnico y útil para una ficha de proyecto. Devuelve solo JSON válido con esta estructura exacta: {"problemaCentral":"string","justificacion":"string","causas":[{"title":"string","description":"string"}],"consecuencias":[{"title":"string","description":"string"}]}. Requisitos obligatorios: 1) genera exactamente 3 causas y 3 consecuencias; 2) el problema central debe ser un párrafo extenso de al menos 110 palabras; 3) la justificación debe tener al menos 2 párrafos y un mínimo de 160 palabras en total; 4) cada descripción de causa y consecuencia debe tener al menos 32 palabras; 5) usa un tono técnico-administrativo, propio de una formulación municipal; 6) si existen parámetros institucionales activos, incorpóralos de forma coherente en la argumentación, alineando el proyecto con la visión del alcalde, instrumentos de planificación y prioridades definidas; 7) si se entregan fragmentos relevantes de documentos estratégicos, úsalos como respaldo contextual y temático; 8) si hay palabras clave activas, priorízalas naturalmente; 9) si hay términos a evitar, no los uses; 10) usa únicamente el contexto entregado y no inventes cifras, instituciones o antecedentes específicos no presentes.',
        },
        {
          role: 'user',
          content: JSON.stringify(context),
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
    throw new Error('El modelo no devolvió contenido.')
  }

  const parsed = parseDraftJson(content)

  if (!parsed) {
    throw new Error('No se pudo interpretar el borrador generado por IA.')
  }

  return parsed
}

function parseDraftJson(content: string) {
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as {
      problemaCentral?: unknown
      justificacion?: unknown
      causas?: Array<{ title?: unknown; description?: unknown }>
      consecuencias?: Array<{ title?: unknown; description?: unknown }>
    }

    const normalizeItems = (
      items: Array<{ title?: unknown; description?: unknown }> | undefined
    ) =>
      (items ?? [])
        .map((item) => ({
          title: String(item?.title ?? '').trim(),
          description: String(item?.description ?? '').trim(),
        }))
        .filter((item) => item.title || item.description)
        .slice(0, 3)

    const causas = normalizeItems(parsed.causas)
    const consecuencias = normalizeItems(parsed.consecuencias)

    if (!String(parsed.problemaCentral ?? '').trim()) return null
    if (!String(parsed.justificacion ?? '').trim()) return null
    if (causas.length === 0 || consecuencias.length === 0) return null

    return {
      problemaCentral: String(parsed.problemaCentral).trim(),
      justificacion: String(parsed.justificacion).trim(),
      causas,
      consecuencias,
    }
  } catch {
    return null
  }
}

function extractNamedValue(
  value: { nombre?: string | null } | { nombre?: string | null }[] | null | undefined
) {
  const record = Array.isArray(value) ? value[0] : value
  return record?.nombre ?? ''
}

function extractResponsibleValue(
  value:
    | { nombre_completo?: string | null }
    | { nombre_completo?: string | null }[]
    | null
    | undefined
) {
  const record = Array.isArray(value) ? value[0] : value
  return record?.nombre_completo ?? ''
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

function sanitizeOpenAIError(message: string) {
  if (message.includes('insufficient_quota')) {
    return 'la cuenta API no tiene cuota disponible'
  }

  return message.slice(0, 240)
}

function buildInstitutionalAlignmentParagraph(
  settings: ReturnType<typeof buildActiveInstitutionalContext>
) {
  const fragments = [
    settings.mayorVision && 'La iniciativa se vincula con la visión estratégica definida por la autoridad comunal',
    settings.municipalPriorities && 'responde a prioridades municipales actualmente relevadas',
    settings.pladecoGuidelines && 'y se alinea con lineamientos comunales contenidos en instrumentos de planificación vigentes',
  ].filter(Boolean)

  if (fragments.length === 0) return ''

  return `${fragments.join(', ')}, reforzando la pertinencia institucional de la intervención y mejorando su coherencia con la planificación pública local.`
}

function buildStrategicClosing(
  settings: ReturnType<typeof buildActiveInstitutionalContext>
) {
  const pieces = [
    settings.regionalPlanGuidelines && 'La propuesta también favorece la articulación con prioridades regionales de inversión y desarrollo.',
    settings.sectoralGuidelines && 'Además, mantiene coherencia con otros lineamientos sectoriales relevantes para la comuna.',
    settings.transversalApproaches && 'Su formulación incorpora enfoques transversales que fortalecen la pertinencia social y territorial del proyecto.',
    settings.draftingInstructions && 'En consecuencia, la argumentación del proyecto puede sostenerse con una narrativa institucional más consistente y mejor orientada a la toma de decisiones.',
  ].filter(Boolean)

  return pieces.join(' ')
}

function buildKeywordsSentence(keywords: string) {
  if (!keywords.trim()) return ''

  return ` La intervención puede reforzarse conceptualmente a partir de nociones clave como ${keywords.trim()}, en la medida que estas se relacionen con el objetivo y alcance del proyecto.`
}

function buildStrategicDocumentsParagraph(
  chunks: Array<{
    documentName: string
    title: string
    content: string
    pageStart: number
    pageEnd: number
    score: number
  }>
) {
  if (chunks.length === 0) return ''

  const topChunk = chunks[0]
  return ` Además, el análisis puede respaldarse en lineamientos temáticos identificados en ${topChunk.documentName}, especialmente en la sección "${topChunk.title}", los cuales entregan un marco adicional de pertinencia territorial e institucional para sustentar la intervención.`
}

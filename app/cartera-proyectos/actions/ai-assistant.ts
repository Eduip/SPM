'use server'

import { createClient } from '../../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import { buildProjectAIContext } from '../../../lib/ai/project-context'
import { buildLocalProjectAssistantAnswer } from '../../../lib/ai/project-insights'

type ConsultarAsistentePayload = {
  proyectoId: string
  pregunta: string
}

const ASSISTANT_PERMISSIONS = [
  PERMISSIONS.proyectosView,
  PERMISSIONS.ejecucionView,
  PERMISSIONS.financiamientoView,
  PERMISSIONS.rendicionesView,
  PERMISSIONS.garantiasView,
  PERMISSIONS.proveedoresView,
  PERMISSIONS.bitacoraView,
  PERMISSIONS.historialView,
]

export async function consultarAsistenteProyecto({
  proyectoId,
  pregunta,
}: ConsultarAsistentePayload) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, ASSISTANT_PERMISSIONS)

  if (!access.success) {
    return access
  }

  const cleanQuestion = pregunta.trim()

  if (!proyectoId) {
    return { success: false, error: 'No se recibió el proyecto.' }
  }

  if (!cleanQuestion) {
    return { success: false, error: 'Escribe una consulta para el asistente.' }
  }

  const contextResult = await buildProjectAIContext({
    supabase,
    projectId: proyectoId,
    authorization: access,
  })

  if (!contextResult.success) {
    return contextResult
  }

  const fallbackAnswer = buildLocalProjectAssistantAnswer({
    question: cleanQuestion,
    context: contextResult.context,
  })
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      success: true,
      answer: fallbackAnswer,
      mode: 'local',
      notice:
        'El asistente respondió con análisis local porque falta configurar OPENAI_API_KEY.',
    }
  }

  try {
    const answer = await callOpenAI({
      apiKey,
      question: cleanQuestion,
      context: contextResult.context,
    })

    return {
      success: true,
      answer,
      mode: 'ai',
    }
  } catch (error) {
    return {
      success: true,
      answer: fallbackAnswer,
      mode: 'local',
      notice:
        error instanceof Error
          ? `No se pudo consultar el modelo IA. Respuesta local: ${error.message}`
          : 'No se pudo consultar el modelo IA. Se usó una respuesta local.',
    }
  }
}

async function callOpenAI({
  apiKey,
  question,
  context,
}: {
  apiKey: string
  question: string
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
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente de gestión de proyectos municipales. Responde en español claro y breve. Usa solo el contexto entregado. Si una sección aparece como denegada o no está en el contexto, indica que el usuario no tiene permisos o que no hay datos disponibles. No inventes información. Prioriza listas concretas, próximos pasos y riesgos.',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              pregunta: question,
              contexto: context,
            },
            null,
            2
          ),
        },
      ],
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Error al consultar OpenAI.')
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }
  const answer = data.choices?.[0]?.message?.content?.trim()

  if (!answer) {
    throw new Error('El modelo no devolvió una respuesta.')
  }

  return answer
}

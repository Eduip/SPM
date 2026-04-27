'use server'

import { revalidatePath } from 'next/cache'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import {
  deleteProjectVisualizationFile,
  getProjectVisualization,
  upsertProjectVisualization,
  writeProjectVisualizationFile,
} from '../../../lib/ai/project-visualizations'
import { downloadRuntimeFile } from '../../../lib/runtime-storage'
import { createClient } from '../../../lib/supabase-server'

type GenerateVisualizationPayload = {
  projectId: string
  userInstructions: string
  imageBase64?: string | null
  imageMimeType?: string | null
  imageName?: string | null
}

export async function generarVisualizacionProyecto(payload: GenerateVisualizationPayload) {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosEdit)

  if (!access.success) {
    return access
  }

  if (!payload.projectId) {
    return { success: false, error: 'No se recibió el proyecto.' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'Falta configurar OPENAI_API_KEY para generar imágenes.',
    }
  }

  const [
    { data: proyecto, error: proyectoError },
    { data: datosGenerales, error: datosError },
  ] = await Promise.all([
    supabase
      .from('proyectos')
      .select('id, nombre, localizacion, fuente:fuentes_financiamiento(nombre)')
      .eq('id', payload.projectId)
      .maybeSingle(),
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion')
      .eq('proyecto_id', payload.projectId)
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
      error: datosError.message || 'No se pudo cargar la descripción del proyecto.',
    }
  }

  const existingVisualization = await getProjectVisualization(payload.projectId)
  const imageSource = await resolveImageSource(payload, existingVisualization)

  if (!imageSource.success) {
    return imageSource
  }

  const referencePrompt = buildVisualizationPrompt({
    projectName: proyecto.nombre ?? 'Proyecto municipal',
    projectDescription: datosGenerales?.descripcion ?? '',
    projectLocation: proyecto.localizacion ?? '',
    fundingSource: extractNamedValue(proyecto.fuente),
    userInstructions: payload.userInstructions,
  })

  try {
    const generatedImages = await callOpenAIImageEdit({
      apiKey,
      prompt: referencePrompt,
      imageBuffer: imageSource.buffer,
      imageMimeType: imageSource.mimeType,
      imageName: imageSource.fileName,
    })

    const timestamp = Date.now()
    const nextReferencePath = payload.imageBase64
      ? await writeProjectVisualizationFile({
          projectId: payload.projectId,
          fileName: `reference-${timestamp}${guessExtension(imageSource.mimeType)}`,
          buffer: imageSource.buffer,
          mimeType: imageSource.mimeType,
        })
      : existingVisualization?.referenceImagePath ?? ''

    const nextGeneratedImages = await Promise.all(
      generatedImages.map(async (generatedImage, index) => ({
        path: await writeProjectVisualizationFile({
          projectId: payload.projectId,
          fileName: `generated-${timestamp}-${index + 1}.png`,
          buffer: generatedImage.buffer,
          mimeType: generatedImage.mimeType,
        }),
        mimeType: generatedImage.mimeType,
      }))
    )

    if (payload.imageBase64) {
      await deleteProjectVisualizationFile(existingVisualization?.referenceImagePath)
    }
    await Promise.all(
      (existingVisualization?.generatedImages ?? []).map((image) =>
        deleteProjectVisualizationFile(image.path)
      )
    )

    const visualization = await upsertProjectVisualization({
      projectId: payload.projectId,
      projectName: proyecto.nombre ?? 'Proyecto municipal',
      referencePrompt,
      userInstructions: payload.userInstructions.trim(),
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      referenceImagePath: nextReferencePath,
      referenceImageMimeType: imageSource.mimeType,
      generatedImages: nextGeneratedImages,
    })

    revalidatePath(`/cartera-proyectos/${payload.projectId}`)

    return {
      success: true,
      visualization: {
        ...visualization,
        referenceUrl: `/api/project-visualizations/${payload.projectId}/reference?t=${timestamp}`,
        generatedUrls: nextGeneratedImages.map(
          (_image, index) =>
            `/api/project-visualizations/${payload.projectId}/generated?idx=${index}&t=${timestamp}`
        ),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo generar la imagen: ${sanitizeOpenAIError(error.message)}`
          : 'No se pudo generar la imagen.',
    }
  }
}

async function resolveImageSource(
  payload: GenerateVisualizationPayload,
  existingVisualization: Awaited<ReturnType<typeof getProjectVisualization>>
) {
  if (payload.imageBase64 && payload.imageMimeType) {
    return {
      success: true as const,
      buffer: Buffer.from(payload.imageBase64, 'base64'),
      mimeType: payload.imageMimeType,
      fileName: payload.imageName?.trim() || `referencia${guessExtension(payload.imageMimeType)}`,
    }
  }

  if (existingVisualization?.referenceImagePath) {
    return {
      success: true as const,
      buffer: await downloadRuntimeFile(existingVisualization.referenceImagePath),
      mimeType: existingVisualization.referenceImageMimeType,
      fileName: existingVisualization.referenceImagePath.split('/').pop() || 'referencia.png',
    }
  }

  return {
    success: false as const,
    error: 'Debes cargar una imagen base para generar la visualización.',
  }
}

async function callOpenAIImageEdit({
  apiKey,
  prompt,
  imageBuffer,
  imageMimeType,
  imageName,
}: {
  apiKey: string
  prompt: string
  imageBuffer: Buffer
  imageMimeType: string
  imageName: string
}) {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
  const formData = new FormData()
  formData.set('model', model)
  formData.set('n', '3')
  formData.set('size', '1536x1024')
  formData.set('prompt', prompt)
  formData.set(
    'image',
    new Blob([new Uint8Array(imageBuffer)], { type: imageMimeType }),
    imageName
  )

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Error al consultar OpenAI.')
  }

  const data = (await response.json()) as {
    data?: Array<{
      b64_json?: string
    }>
  }

  const generatedImages = (data.data ?? [])
    .map((item) => item.b64_json)
    .filter((item): item is string => Boolean(item))
    .map((item) => ({
      buffer: Buffer.from(item, 'base64'),
      mimeType: 'image/png',
    }))

  if (generatedImages.length === 0) {
    throw new Error('El modelo no devolvió una imagen.')
  }

  return generatedImages
}

function buildVisualizationPrompt({
  projectName,
  projectDescription,
  projectLocation,
  fundingSource,
  userInstructions,
}: {
  projectName: string
  projectDescription: string
  projectLocation: string
  fundingSource: string
  userInstructions: string
}) {
  return [
    'Genera una visualización fotorealista de un proyecto municipal chileno.',
    'Usa la imagen de referencia como base principal y consérvala casi como un fotomontaje arquitectónico realista.',
    'Mantén la perspectiva exacta del sitio, la proporción de calles, edificaciones, pendientes, vegetación y elementos urbanos existentes.',
    'Transforma el espacio solo en lo necesario para mostrar el proyecto ejecutado, sin cambiar artificialmente la geografía, el ancho de las calles ni la escala del lugar.',
    'Evita el estilo de arte digital, render brillante, ilustración, fantasía o imagen publicitaria excesivamente pulida.',
    'Debe parecer una intervención plausible sobre una fotografía real tomada en terreno.',
    'Usa iluminación natural coherente con la escena original, materiales sobrios, sombras consistentes y detalle urbano verosímil.',
    'No agregues personas deformes, vehículos irreales, mobiliario exagerado, texto, logos, marcas de agua, planos ni señalética inventada.',
    'Prioriza realismo visual por sobre espectacularidad.',
    `Nombre del proyecto: ${projectName}.`,
    projectDescription ? `Descripción del proyecto: ${projectDescription}.` : '',
    projectLocation ? `Localización: ${projectLocation}.` : '',
    fundingSource ? `Fuente de financiamiento: ${fundingSource}.` : '',
    userInstructions.trim()
      ? `Instrucciones adicionales del usuario: ${userInstructions.trim()}.`
      : 'Instrucciones adicionales del usuario: mostrar una propuesta ordenada, verosímil y visualmente clara.',
  ]
    .filter(Boolean)
    .join(' ')
}

function extractNamedValue(value: { nombre?: string | null } | { nombre?: string | null }[] | null) {
  if (!value) return ''
  if (Array.isArray(value)) return value[0]?.nombre ?? ''
  return value.nombre ?? ''
}

function guessExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/webp') return '.webp'
  return '.png'
}

function sanitizeOpenAIError(message: string) {
  return message
    .replace(/\s+/g, ' ')
    .replace(/^Error:\s*/i, '')
    .trim()
}

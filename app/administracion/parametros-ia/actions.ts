'use server'

import { requireAdmin } from '../../../lib/auth-guards'
import { extractStrategicPdf } from '../../../lib/ai/extract-strategic-pdf'
import { loadMunicipalAISettings, saveMunicipalAISettings } from '../../../lib/ai/municipal-ai-settings'
import {
  addStrategicDocument,
  listStrategicDocumentSummaries,
  removeStrategicDocument,
  toStrategicDocumentSummary,
  writeStrategicDocumentFile,
  type StrategicDocument,
} from '../../../lib/ai/strategic-documents'
import { createClient } from '../../../lib/supabase-server'

type SaveAIParametersPayload = {
  mayorVision: string
  municipalPriorities: string
  pladecoGuidelines: string
  regionalPlanGuidelines: string
  sectoralGuidelines: string
  transversalApproaches: string
  draftingInstructions: string
  keywords: string
  avoidTerms: string
  enabled: {
    mayorVision: boolean
    municipalPriorities: boolean
    pladecoGuidelines: boolean
    regionalPlanGuidelines: boolean
    sectoralGuidelines: boolean
    transversalApproaches: boolean
    draftingInstructions: boolean
    keywords: boolean
    avoidTerms: boolean
  }
}

export async function guardarParametrosIA(payload: SaveAIParametersPayload) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const savedSettings = await saveMunicipalAISettings(payload)

  return {
    success: true,
    settings: savedSettings,
  }
}

export async function obtenerParametrosIA() {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  return {
    success: true,
    settings: await loadMunicipalAISettings(),
  }
}

export async function listarDocumentosEstrategicosIA() {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  return {
    success: true,
    documents: await listStrategicDocumentSummaries(),
  }
}

export async function subirDocumentoEstrategicoIA(formData: FormData) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  const name = String(formData.get('name') || '').trim()
  const type = String(formData.get('type') || '').trim() || 'general'
  const file = formData.get('file') as File | null

  if (!name) {
    return { success: false, error: 'Debes indicar un nombre para el documento estratégico.' }
  }

  if (!file) {
    return { success: false, error: 'Debes seleccionar un archivo PDF.' }
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'Solo se permiten archivos PDF.' }
  }

  const safeOriginalName = file.name.replace(/\s+/g, '-')
  const timestamp = Date.now()
  const storedName = `${timestamp}-${safeOriginalName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const parsed = await extractStrategicPdf(buffer)

    const chunks = Array.isArray(parsed.chunks)
      ? parsed.chunks.filter((chunk) => chunk.content?.trim())
      : []

    if (chunks.length === 0) {
      return {
        success: false,
        error: 'No se pudo extraer contenido legible desde el PDF seleccionado.',
      }
    }

    const filePath = await writeStrategicDocumentFile({
      fileName: storedName,
      buffer,
    })

    const document: StrategicDocument = {
      id: `doc-${timestamp}`,
      name,
      originalFileName: file.name,
      type,
      mimeType: file.type,
      filePath,
      uploadedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      pageCount: Number(parsed.pageCount ?? 0),
      active: true,
      chunks,
    }

    await addStrategicDocument(document)

    return {
      success: true,
      document: toStrategicDocumentSummary(document),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo procesar el PDF: ${error.message}`
          : 'No se pudo procesar el PDF.',
    }
  }
}

export async function eliminarDocumentoEstrategicoIA(documentId: string) {
  const supabase = await createClient()
  const adminGuard = await requireAdmin(supabase)

  if (!adminGuard.success) {
    return adminGuard
  }

  if (!documentId) {
    return { success: false, error: 'No se recibió el documento estratégico a eliminar.' }
  }

  return removeStrategicDocument(documentId)
}

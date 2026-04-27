'use server'

import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { requireAdmin } from '../../../lib/auth-guards'
import { loadMunicipalAISettings, saveMunicipalAISettings } from '../../../lib/ai/municipal-ai-settings'
import {
  addStrategicDocument,
  listStrategicDocuments,
  removeStrategicDocument,
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

const execFileAsync = promisify(execFile)
const PYTHON_BIN =
  '/Users/edu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
const PDF_EXTRACTOR = `${process.cwd()}/scripts/extract_strategic_pdf.py`

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
    documents: await listStrategicDocuments(),
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
  const tempFilePath = path.join(os.tmpdir(), storedName)

  try {
    await writeFile(tempFilePath, buffer)

    const { stdout } = await execFileAsync(PYTHON_BIN, [PDF_EXTRACTOR, tempFilePath], {
      maxBuffer: 1024 * 1024 * 20,
    })

    const parsed = JSON.parse(stdout) as {
      pageCount?: number
      chunks?: StrategicDocument['chunks']
      error?: string
    }

    if (parsed.error) {
      return { success: false, error: 'No se pudo extraer el contenido del PDF.' }
    }

    const chunks = Array.isArray(parsed.chunks) ? parsed.chunks.filter((chunk) => chunk.content?.trim()) : []

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
      document,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `No se pudo procesar el PDF: ${error.message}`
          : 'No se pudo procesar el PDF.',
    }
  } finally {
    await rm(tempFilePath, { force: true }).catch(() => undefined)
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

import {
  loadRuntimeJson,
  removeRuntimeFile,
  saveRuntimeJson,
  uploadRuntimeFile,
} from '../runtime-storage'

export type StrategicDocumentChunk = {
  id: string
  title: string
  content: string
  pageStart: number
  pageEnd: number
  keywords: string[]
}

export type StrategicDocument = {
  id: string
  name: string
  originalFileName: string
  type: string
  mimeType: string
  filePath: string
  uploadedAt: string
  chunkCount: number
  pageCount: number
  active: boolean
  chunks: StrategicDocumentChunk[]
}

export type StrategicDocumentSummary = Omit<StrategicDocument, 'chunks'> & {
  chunks?: never
}

type StrategicDocumentsStore = {
  version: number
  documents: StrategicDocument[]
}

const STORE_FILE = 'config/strategic-ai-documents.json'
const LOCAL_STORE_FILE = 'data/strategic-ai-documents.json'

const DEFAULT_STORE: StrategicDocumentsStore = {
  version: 1,
  documents: [],
}

export async function loadStrategicDocumentsStore() {
  const parsed = await loadRuntimeJson<Partial<StrategicDocumentsStore>>(
    STORE_FILE,
    DEFAULT_STORE,
    LOCAL_STORE_FILE
  )
  return {
    version: 1,
    documents: Array.isArray(parsed.documents) ? parsed.documents : [],
  }
}

export async function saveStrategicDocumentsStore(store: StrategicDocumentsStore) {
  await saveRuntimeJson(STORE_FILE, store)
  return store
}

export async function listStrategicDocuments() {
  const store = await loadStrategicDocumentsStore()
  return store.documents
}

export async function listStrategicDocumentSummaries(): Promise<StrategicDocumentSummary[]> {
  const documents = await listStrategicDocuments()
  return documents.map(toStrategicDocumentSummary)
}

export async function addStrategicDocument(document: StrategicDocument) {
  const store = await loadStrategicDocumentsStore()
  const nextStore = {
    ...store,
    documents: [document, ...store.documents.filter((item) => item.id !== document.id)],
  }
  await saveStrategicDocumentsStore(nextStore)
  return document
}

export async function removeStrategicDocument(documentId: string) {
  const store = await loadStrategicDocumentsStore()
  const existing = store.documents.find((item) => item.id === documentId)

  if (!existing) {
    return { success: false, error: 'No se encontró el documento estratégico.' }
  }

  await removeRuntimeFile(existing.filePath).catch(() => undefined)

  const nextStore = {
    ...store,
    documents: store.documents.filter((item) => item.id !== documentId),
  }

  await saveStrategicDocumentsStore(nextStore)
  return { success: true }
}

export function toStrategicDocumentSummary(
  document: StrategicDocument
): StrategicDocumentSummary {
  const summary = { ...document }
  delete (summary as StrategicDocument).chunks
  return summary
}

export async function writeStrategicDocumentFile({
  fileName,
  buffer,
}: {
  fileName: string
  buffer: Buffer
}) {
  const filePath = `ai-documents/${fileName}`
  await uploadRuntimeFile({
    path: filePath,
    buffer,
    contentType: 'application/pdf',
  })
  return filePath
}

export function getRelevantStrategicChunks({
  documents,
  query,
  limit = 4,
}: {
  documents: StrategicDocument[]
  query: string
  limit?: number
}) {
  const normalizedTerms = normalizeQuery(query)
  if (normalizedTerms.length === 0) return []

  const scored = documents
    .filter((document) => document.active !== false)
    .flatMap((document) =>
      document.chunks.map((chunk) => ({
        documentName: document.name,
        title: chunk.title,
        content: chunk.content,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        score: scoreChunk(chunk, normalizedTerms),
      }))
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

function scoreChunk(chunk: StrategicDocumentChunk, terms: string[]) {
  const haystack = normalizeText(`${chunk.title} ${chunk.content} ${chunk.keywords.join(' ')}`)

  return terms.reduce((score, term) => {
    if (!term) return score
    if (haystack.includes(term)) {
      const titleBonus = normalizeText(chunk.title).includes(term) ? 3 : 0
      const keywordBonus = chunk.keywords.some((keyword) => normalizeText(keyword).includes(term))
        ? 2
        : 0
      return score + 1 + titleBonus + keywordBonus
    }
    return score
  }, 0)
}

function normalizeQuery(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

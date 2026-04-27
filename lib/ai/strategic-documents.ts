import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'

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

type StrategicDocumentsStore = {
  version: number
  documents: StrategicDocument[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DOCS_DIR = path.join(DATA_DIR, 'ai-documents')
const STORE_FILE = path.join(DATA_DIR, 'strategic-ai-documents.json')

const DEFAULT_STORE: StrategicDocumentsStore = {
  version: 1,
  documents: [],
}

export async function loadStrategicDocumentsStore() {
  try {
    const content = await readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(content) as Partial<StrategicDocumentsStore>
    return {
      version: 1,
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    }
  } catch {
    return DEFAULT_STORE
  }
}

export async function saveStrategicDocumentsStore(store: StrategicDocumentsStore) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
  return store
}

export async function listStrategicDocuments() {
  const store = await loadStrategicDocumentsStore()
  return store.documents
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

  try {
    await unlink(existing.filePath)
  } catch {
  }

  const nextStore = {
    ...store,
    documents: store.documents.filter((item) => item.id !== documentId),
  }

  await saveStrategicDocumentsStore(nextStore)
  return { success: true }
}

export async function writeStrategicDocumentFile({
  fileName,
  buffer,
}: {
  fileName: string
  buffer: Buffer
}) {
  await mkdir(DOCS_DIR, { recursive: true })
  const filePath = path.join(DOCS_DIR, fileName)
  await writeFile(filePath, buffer)
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

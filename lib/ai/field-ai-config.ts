import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export type FieldAIMode = 'blocked' | 'suggest' | 'improve_only'

export type FieldAIConfigItem = {
  fieldId: string
  mode: FieldAIMode
}

type FieldAIConfigStore = {
  version: number
  fields: FieldAIConfigItem[]
}

const STORE_FILE = path.join(process.cwd(), 'data', 'field-ai-config.json')

const DEFAULT_STORE: FieldAIConfigStore = {
  version: 1,
  fields: [],
}

export async function loadFieldAIConfigStore() {
  try {
    const content = await readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(content) as Partial<FieldAIConfigStore>
    return {
      version: 1,
      fields: Array.isArray(parsed.fields) ? parsed.fields : [],
    }
  } catch {
    return DEFAULT_STORE
  }
}

export async function saveFieldAIConfigStore(store: FieldAIConfigStore) {
  await mkdir(path.dirname(STORE_FILE), { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
  return store
}

export async function getFieldAIMode(fieldId: string, fallback: FieldAIMode = 'blocked') {
  const store = await loadFieldAIConfigStore()
  return store.fields.find((item) => item.fieldId === fieldId)?.mode ?? fallback
}

export async function listFieldAIConfigs() {
  const store = await loadFieldAIConfigStore()
  return store.fields
}

export async function saveFieldAIConfig(fieldId: string, mode: FieldAIMode) {
  const store = await loadFieldAIConfigStore()
  const nextFields = [
    { fieldId, mode },
    ...store.fields.filter((item) => item.fieldId !== fieldId),
  ]

  await saveFieldAIConfigStore({
    version: 1,
    fields: nextFields,
  })

  return { success: true as const }
}

import { loadRuntimeJson, saveRuntimeJson } from '../runtime-storage'

export type FieldAIMode = 'blocked' | 'suggest' | 'improve_only'

export type FieldAIConfigItem = {
  fieldId: string
  mode: FieldAIMode
}

type FieldAIConfigStore = {
  version: number
  fields: FieldAIConfigItem[]
}

const STORE_FILE = 'config/field-ai-config.json'
const LOCAL_STORE_FILE = 'data/field-ai-config.json'

const DEFAULT_STORE: FieldAIConfigStore = {
  version: 1,
  fields: [],
}

export async function loadFieldAIConfigStore() {
  const parsed = await loadRuntimeJson<Partial<FieldAIConfigStore>>(
    STORE_FILE,
    DEFAULT_STORE,
    LOCAL_STORE_FILE
  )
  return {
    version: 1,
    fields: Array.isArray(parsed.fields) ? parsed.fields : [],
  }
}

export async function saveFieldAIConfigStore(store: FieldAIConfigStore) {
  await saveRuntimeJson(STORE_FILE, store)
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

import { loadRuntimeJson, saveRuntimeJson } from './runtime-storage'

export type EstadoPagoDocumentoConfig = {
  id: string
  fuenteId: string
  nombre: string
  obligatorio: boolean
  orden: number
}

type EstadoPagoDocumentoConfigStore = {
  version: number
  items: EstadoPagoDocumentoConfig[]
}

const STORE_FILE = 'config/estado-pago-documentos.json'
const LOCAL_STORE_FILE = 'data/estado-pago-documentos.json'

const DEFAULT_STORE: EstadoPagoDocumentoConfigStore = {
  version: 1,
  items: [],
}

function sanitizeItem(input: Partial<EstadoPagoDocumentoConfig>): EstadoPagoDocumentoConfig | null {
  const id = typeof input.id === 'string' ? input.id.trim() : ''
  const fuenteId = typeof input.fuenteId === 'string' ? input.fuenteId.trim() : ''
  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : ''
  const orden = Number(input.orden ?? 0)

  if (!id || !fuenteId || !nombre) {
    return null
  }

  return {
    id,
    fuenteId,
    nombre,
    obligatorio: Boolean(input.obligatorio),
    orden: Number.isFinite(orden) ? orden : 0,
  }
}

export async function loadEstadoPagoDocumentoConfigStore() {
  const parsed = await loadRuntimeJson<Partial<EstadoPagoDocumentoConfigStore>>(
    STORE_FILE,
    DEFAULT_STORE,
    LOCAL_STORE_FILE
  )

  return {
    version: 1,
    items: Array.isArray(parsed.items)
      ? parsed.items
          .map((item) => sanitizeItem(item))
          .filter((item): item is EstadoPagoDocumentoConfig => Boolean(item))
      : [],
  }
}

export async function saveEstadoPagoDocumentoConfigStore(
  store: EstadoPagoDocumentoConfigStore
) {
  await saveRuntimeJson(STORE_FILE, store)
  return store
}

export async function listEstadoPagoDocumentConfigs() {
  const store = await loadEstadoPagoDocumentoConfigStore()
  return store.items.sort((a, b) => a.orden - b.orden)
}

export async function listEstadoPagoDocumentConfigsByFuente(fuenteId?: string | null) {
  if (!fuenteId) return []

  const items = await listEstadoPagoDocumentConfigs()
  return items.filter((item) => item.fuenteId === fuenteId)
}

export async function createEstadoPagoDocumentConfig(input: {
  fuenteId: string
  nombre: string
  obligatorio: boolean
}) {
  const fuenteId = input.fuenteId.trim()
  const nombre = input.nombre.trim()

  if (!fuenteId || !nombre) {
    return { success: false as const, error: 'Faltan datos para crear el documento.' }
  }

  const store = await loadEstadoPagoDocumentoConfigStore()
  const itemsFuente = store.items.filter((item) => item.fuenteId === fuenteId)
  const nextOrder =
    itemsFuente.length > 0
      ? Math.max(...itemsFuente.map((item) => Number(item.orden) || 0)) + 1
      : 1

  const nextItem: EstadoPagoDocumentoConfig = {
    id: crypto.randomUUID(),
    fuenteId,
    nombre,
    obligatorio: input.obligatorio,
    orden: nextOrder,
  }

  await saveEstadoPagoDocumentoConfigStore({
    version: 1,
    items: [...store.items, nextItem],
  })

  return { success: true as const, item: nextItem }
}

export async function deleteEstadoPagoDocumentConfig(id: string) {
  const targetId = id.trim()

  if (!targetId) {
    return { success: false as const, error: 'No se recibió el documento a eliminar.' }
  }

  const store = await loadEstadoPagoDocumentoConfigStore()

  await saveEstadoPagoDocumentoConfigStore({
    version: 1,
    items: store.items.filter((item) => item.id !== targetId),
  })

  return { success: true as const }
}

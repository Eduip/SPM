import {
  loadRuntimeJson,
  removeRuntimeFile,
  saveRuntimeJson,
  uploadRuntimeFile,
} from '../runtime-storage'

export type ProjectVisualization = {
  projectId: string
  projectName: string
  referencePrompt: string
  userInstructions: string
  generatedAt: string
  updatedAt: string
  referenceImagePath: string
  referenceImageMimeType: string
  generatedImages: Array<{
    path: string
    mimeType: string
  }>
}

type ProjectVisualizationsStore = {
  version: number
  visualizations: ProjectVisualization[]
}

const STORE_FILE = 'config/project-visualizations.json'
const LOCAL_STORE_FILE = 'data/project-visualizations.json'

const DEFAULT_STORE: ProjectVisualizationsStore = {
  version: 1,
  visualizations: [],
}

export async function loadProjectVisualizationsStore() {
  const parsed = await loadRuntimeJson<Partial<ProjectVisualizationsStore>>(
    STORE_FILE,
    DEFAULT_STORE,
    LOCAL_STORE_FILE
  )

  return {
    version: 1,
    visualizations: Array.isArray(parsed.visualizations)
      ? parsed.visualizations.map((item) =>
          normalizeVisualization(
            item as ProjectVisualization & {
              generatedImagePath?: string
              generatedImageMimeType?: string
            }
          )
        )
      : [],
  }
}

export async function saveProjectVisualizationsStore(store: ProjectVisualizationsStore) {
  await saveRuntimeJson(STORE_FILE, store)
  return store
}

export async function getProjectVisualization(projectId: string) {
  const store = await loadProjectVisualizationsStore()
  return store.visualizations.find((item) => item.projectId === projectId) ?? null
}

export async function upsertProjectVisualization(visualization: ProjectVisualization) {
  const store = await loadProjectVisualizationsStore()
  const nextStore = {
    ...store,
    visualizations: [
      visualization,
      ...store.visualizations.filter((item) => item.projectId !== visualization.projectId),
    ],
  }

  await saveProjectVisualizationsStore(nextStore)
  return visualization
}

export async function writeProjectVisualizationFile({
  projectId,
  fileName,
  buffer,
  mimeType,
}: {
  projectId: string
  fileName: string
  buffer: Buffer
  mimeType: string
}) {
  const filePath = `project-visualizations/${projectId}/${fileName}`
  await uploadRuntimeFile({
    path: filePath,
    buffer,
    contentType: mimeType,
  })
  return filePath
}

export async function deleteProjectVisualizationFile(filePath?: string | null) {
  if (!filePath) return

  await removeRuntimeFile(filePath).catch(() => undefined)
}

function normalizeVisualization(
  visualization: ProjectVisualization & {
    generatedImagePath?: string
    generatedImageMimeType?: string
  }
) {
  if (Array.isArray(visualization.generatedImages)) {
    return visualization
  }

  return {
    ...visualization,
    generatedImages:
      visualization.generatedImagePath && visualization.generatedImageMimeType
        ? [
            {
              path: visualization.generatedImagePath,
              mimeType: visualization.generatedImageMimeType,
            },
          ]
        : [],
  }
}

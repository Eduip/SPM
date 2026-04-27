import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'

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

const DATA_DIR = path.join(process.cwd(), 'data')
const VISUALIZATIONS_DIR = path.join(DATA_DIR, 'project-visualizations')
const STORE_FILE = path.join(DATA_DIR, 'project-visualizations.json')

const DEFAULT_STORE: ProjectVisualizationsStore = {
  version: 1,
  visualizations: [],
}

export async function loadProjectVisualizationsStore() {
  try {
    const content = await readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(content) as Partial<ProjectVisualizationsStore>

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
  } catch {
    return DEFAULT_STORE
  }
}

export async function saveProjectVisualizationsStore(store: ProjectVisualizationsStore) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8')
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
}: {
  projectId: string
  fileName: string
  buffer: Buffer
}) {
  const projectDir = path.join(VISUALIZATIONS_DIR, projectId)
  await mkdir(projectDir, { recursive: true })
  const filePath = path.join(projectDir, fileName)
  await writeFile(filePath, buffer)
  return filePath
}

export async function deleteProjectVisualizationFile(filePath?: string | null) {
  if (!filePath) return

  try {
    await rm(filePath, { force: true })
  } catch {
  }
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

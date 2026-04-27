import { NextResponse } from 'next/server'
import { PERMISSIONS, requirePermission } from '../../../../../lib/auth-guards'
import { getProjectVisualization } from '../../../../../lib/ai/project-visualizations'
import { downloadRuntimeFile } from '../../../../../lib/runtime-storage'
import { createClient } from '../../../../../lib/supabase-server'

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; kind: string }>
  }
) {
  const { projectId, kind } = await params
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.proyectosView)

  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: 403 })
  }

  const visualization = await getProjectVisualization(projectId)

  if (!visualization) {
    return NextResponse.json({ error: 'No existe visualización para este proyecto.' }, { status: 404 })
  }

  const generatedIndex = normalizeGeneratedIndex(new URL(request.url).searchParams.get('idx'))

  const targetPath =
    kind === 'reference'
      ? visualization.referenceImagePath
      : kind === 'generated'
        ? visualization.generatedImages[generatedIndex]?.path
        : null

  const mimeType =
    kind === 'reference'
      ? visualization.referenceImageMimeType
      : kind === 'generated'
        ? visualization.generatedImages[generatedIndex]?.mimeType
        : null

  if (!targetPath || !mimeType) {
    return NextResponse.json({ error: 'No existe la imagen solicitada.' }, { status: 404 })
  }

  try {
    const buffer = await downloadRuntimeFile(targetPath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'No se pudo leer la imagen.' }, { status: 404 })
  }
}

function normalizeGeneratedIndex(value: string | null) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

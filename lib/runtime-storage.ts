import { Buffer } from 'node:buffer'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { createAdminClient } from './supabase-admin'

const BUCKET = 'runtime-data'

type UploadPayload = {
  path: string
  buffer: Buffer
  contentType: string
}

async function ensureBucket() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.getBucket(BUCKET)

  if (!error && data) {
    return BUCKET
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: '50MB',
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(createError.message || 'No se pudo crear el bucket de persistencia.')
  }

  return BUCKET
}

export async function uploadRuntimeFile({ path, buffer, contentType }: UploadPayload) {
  const supabase = createAdminClient()
  const bucket = await ensureBucket()

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(error.message || 'No se pudo subir el archivo de runtime.')
  }

  return { bucket, path }
}

export async function downloadRuntimeFile(path: string) {
  if (path.startsWith('/') || path.startsWith('./') || path.startsWith('../')) {
    return readFile(path)
  }

  const supabase = createAdminClient()
  const bucket = await ensureBucket()
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo descargar el archivo de runtime.')
  }

  return Buffer.from(await data.arrayBuffer())
}

export async function removeRuntimeFile(path?: string | null) {
  if (!path) return

  if (path.startsWith('/') || path.startsWith('./') || path.startsWith('../')) {
    await rm(path, { force: true }).catch(() => undefined)
    return
  }

  const supabase = createAdminClient()
  const bucket = await ensureBucket()
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message || 'No se pudo eliminar el archivo de runtime.')
  }
}

export async function loadRuntimeJson<T>(
  targetPath: string,
  fallback: T,
  localFallbackPath?: string
) {
  try {
    const content = await downloadRuntimeFile(targetPath)
    return JSON.parse(content.toString('utf8')) as T
  } catch {
    if (localFallbackPath) {
      try {
        const content = await readFile(path.resolve(localFallbackPath), 'utf8')
        return JSON.parse(content) as T
      } catch {
      }
    }

    return fallback
  }
}

export async function saveRuntimeJson<T>(targetPath: string, payload: T) {
  await uploadRuntimeFile({
    path: targetPath,
    buffer: Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
    contentType: 'application/json; charset=utf-8',
  })
  return payload
}

export function clearRuntimeJsonCache(path?: string) {
  return path
}

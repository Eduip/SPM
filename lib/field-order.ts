import type { CampoPostulacion } from './formulacion-types'

function parseOrderCode(value: string | null | undefined) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/,/g, '.')

  if (!normalized) return []

  return normalized
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const parsed = Number(segment)
      return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
    })
}

export function getCampoOrderLabel(campo: Pick<CampoPostulacion, 'orden' | 'orden_codigo'>) {
  const customCode = String(campo.orden_codigo ?? '').trim()
  return customCode || String(campo.orden)
}

export function compareCampoOrder(
  a: Pick<CampoPostulacion, 'orden' | 'orden_codigo' | 'nombre'>,
  b: Pick<CampoPostulacion, 'orden' | 'orden_codigo' | 'nombre'>
) {
  const aParts = parseOrderCode(a.orden_codigo)
  const bParts = parseOrderCode(b.orden_codigo)
  const hasAParts = aParts.length > 0
  const hasBParts = bParts.length > 0

  if (hasAParts || hasBParts) {
    const maxLength = Math.max(aParts.length, bParts.length)

    for (let index = 0; index < maxLength; index += 1) {
      const aValue = aParts[index] ?? 0
      const bValue = bParts[index] ?? 0

      if (aValue !== bValue) {
        return aValue - bValue
      }
    }
  }

  if (a.orden !== b.orden) return a.orden - b.orden

  return a.nombre.localeCompare(b.nombre, 'es')
}

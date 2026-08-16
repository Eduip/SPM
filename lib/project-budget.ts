import type { DynamicFieldValue } from './formulacion-types'

export type BudgetField = {
  id: string
  fuente_id: string
  tipo?: string | null
}

export type BudgetResponse = {
  proyecto_id: string
  campo_id: string
  valor_texto?: string | null
  valor_numero?: number | string | null
  valor_json?: DynamicFieldValue
}

export type ProjectFundingSelection = {
  proyecto_id: string
  fuente_id: string | null
}

export function buildProjectBudgetMap({
  projectIds,
  fundingSelections,
  budgetFields,
  responses,
}: {
  projectIds: string[]
  fundingSelections: ProjectFundingSelection[]
  budgetFields: BudgetField[]
  responses: BudgetResponse[]
}) {
  const selectedFundingByProject = new Map<string, string | null>(
    fundingSelections.map((item) => [item.proyecto_id, item.fuente_id] as const)
  )

  const budgetFieldIdsByFunding = new Map<string, Set<string>>()
  for (const field of budgetFields) {
    if (field.tipo !== 'presupuesto' && field.tipo !== 'tabla_presupuesto') continue

    const fieldIds = budgetFieldIdsByFunding.get(field.fuente_id) ?? new Set<string>()
    fieldIds.add(field.id)
    budgetFieldIdsByFunding.set(field.fuente_id, fieldIds)
  }

  const responsesByProject = new Map<string, BudgetResponse[]>()
  for (const response of responses) {
    const projectResponses = responsesByProject.get(response.proyecto_id) ?? []
    projectResponses.push(response)
    responsesByProject.set(response.proyecto_id, projectResponses)
  }

  const budgetsByProject = new Map<string, number | null>()
  for (const projectId of projectIds) {
    const fuenteId = selectedFundingByProject.get(projectId)
    const budgetFieldIds = fuenteId ? budgetFieldIdsByFunding.get(fuenteId) : null

    if (!budgetFieldIds?.size) {
      budgetsByProject.set(projectId, null)
      continue
    }

    const total = (responsesByProject.get(projectId) ?? [])
      .filter((response) => budgetFieldIds.has(response.campo_id))
      .reduce<number>((acc, response) => acc + responseValueToNumber(response), 0)

    budgetsByProject.set(projectId, total)
  }

  return budgetsByProject
}

export function responseValueToNumber(response: BudgetResponse): number {
  if (response.valor_numero !== null && response.valor_numero !== undefined) {
    return Number(response.valor_numero) || 0
  }

  if (response.valor_texto) {
    return parseMoneyValue(response.valor_texto)
  }

  if (typeof response.valor_json === 'number') {
    return response.valor_json
  }

  if (typeof response.valor_json === 'string') {
    return parseMoneyValue(response.valor_json)
  }

  if (response.valor_json && typeof response.valor_json === 'object' && !Array.isArray(response.valor_json)) {
    return Object.values(response.valor_json as Record<string, unknown>).reduce<number>((acc, value) => {
      if (typeof value === 'number') return acc + value
      if (typeof value === 'string') return acc + parseMoneyValue(value)
      return acc
    }, 0)
  }

  return 0
}

function parseMoneyValue(value: string) {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

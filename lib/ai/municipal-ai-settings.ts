import { loadRuntimeJson, saveRuntimeJson } from '../runtime-storage'

export type MunicipalAISettings = {
  version: number
  updatedAt: string | null
  mayorVision: string
  municipalPriorities: string
  pladecoGuidelines: string
  regionalPlanGuidelines: string
  sectoralGuidelines: string
  transversalApproaches: string
  draftingInstructions: string
  keywords: string
  avoidTerms: string
  enabled: {
    mayorVision: boolean
    municipalPriorities: boolean
    pladecoGuidelines: boolean
    regionalPlanGuidelines: boolean
    sectoralGuidelines: boolean
    transversalApproaches: boolean
    draftingInstructions: boolean
    keywords: boolean
    avoidTerms: boolean
  }
}

const SETTINGS_FILE = 'config/municipal-ai-settings.json'
const LOCAL_SETTINGS_FILE = 'data/municipal-ai-settings.json'

export const defaultMunicipalAISettings: MunicipalAISettings = {
  version: 1,
  updatedAt: null,
  mayorVision: '',
  municipalPriorities: '',
  pladecoGuidelines: '',
  regionalPlanGuidelines: '',
  sectoralGuidelines: '',
  transversalApproaches: '',
  draftingInstructions: '',
  keywords: '',
  avoidTerms: '',
  enabled: {
    mayorVision: true,
    municipalPriorities: true,
    pladecoGuidelines: true,
    regionalPlanGuidelines: true,
    sectoralGuidelines: true,
    transversalApproaches: true,
    draftingInstructions: true,
    keywords: true,
    avoidTerms: true,
  },
}

export async function loadMunicipalAISettings() {
  const parsed = await loadRuntimeJson<Partial<MunicipalAISettings>>(
    SETTINGS_FILE,
    defaultMunicipalAISettings,
    LOCAL_SETTINGS_FILE
  )
  return normalizeSettings(parsed)
}

export async function saveMunicipalAISettings(
  partialSettings: Partial<MunicipalAISettings>
) {
  const current = await loadMunicipalAISettings()
  const next = normalizeSettings({
    ...current,
    ...partialSettings,
    enabled: {
      ...current.enabled,
      ...(partialSettings.enabled ?? {}),
    },
    updatedAt: new Date().toISOString(),
  })

  await saveRuntimeJson(SETTINGS_FILE, next)

  return next
}

export function buildActiveInstitutionalContext(settings: MunicipalAISettings) {
  return {
    mayorVision: settings.enabled.mayorVision ? settings.mayorVision.trim() : '',
    municipalPriorities: settings.enabled.municipalPriorities
      ? settings.municipalPriorities.trim()
      : '',
    pladecoGuidelines: settings.enabled.pladecoGuidelines
      ? settings.pladecoGuidelines.trim()
      : '',
    regionalPlanGuidelines: settings.enabled.regionalPlanGuidelines
      ? settings.regionalPlanGuidelines.trim()
      : '',
    sectoralGuidelines: settings.enabled.sectoralGuidelines
      ? settings.sectoralGuidelines.trim()
      : '',
    transversalApproaches: settings.enabled.transversalApproaches
      ? settings.transversalApproaches.trim()
      : '',
    draftingInstructions: settings.enabled.draftingInstructions
      ? settings.draftingInstructions.trim()
      : '',
    keywords: settings.enabled.keywords ? settings.keywords.trim() : '',
    avoidTerms: settings.enabled.avoidTerms ? settings.avoidTerms.trim() : '',
  }
}

function normalizeSettings(settings: Partial<MunicipalAISettings>): MunicipalAISettings {
  return {
    version: 1,
    updatedAt:
      typeof settings.updatedAt === 'string' && settings.updatedAt.trim()
        ? settings.updatedAt
        : null,
    mayorVision: String(settings.mayorVision ?? '').trim(),
    municipalPriorities: String(settings.municipalPriorities ?? '').trim(),
    pladecoGuidelines: String(settings.pladecoGuidelines ?? '').trim(),
    regionalPlanGuidelines: String(settings.regionalPlanGuidelines ?? '').trim(),
    sectoralGuidelines: String(settings.sectoralGuidelines ?? '').trim(),
    transversalApproaches: String(settings.transversalApproaches ?? '').trim(),
    draftingInstructions: String(settings.draftingInstructions ?? '').trim(),
    keywords: String(settings.keywords ?? '').trim(),
    avoidTerms: String(settings.avoidTerms ?? '').trim(),
    enabled: {
      mayorVision:
        settings.enabled?.mayorVision ?? defaultMunicipalAISettings.enabled.mayorVision,
      municipalPriorities:
        settings.enabled?.municipalPriorities ??
        defaultMunicipalAISettings.enabled.municipalPriorities,
      pladecoGuidelines:
        settings.enabled?.pladecoGuidelines ??
        defaultMunicipalAISettings.enabled.pladecoGuidelines,
      regionalPlanGuidelines:
        settings.enabled?.regionalPlanGuidelines ??
        defaultMunicipalAISettings.enabled.regionalPlanGuidelines,
      sectoralGuidelines:
        settings.enabled?.sectoralGuidelines ??
        defaultMunicipalAISettings.enabled.sectoralGuidelines,
      transversalApproaches:
        settings.enabled?.transversalApproaches ??
        defaultMunicipalAISettings.enabled.transversalApproaches,
      draftingInstructions:
        settings.enabled?.draftingInstructions ??
        defaultMunicipalAISettings.enabled.draftingInstructions,
      keywords:
        settings.enabled?.keywords ?? defaultMunicipalAISettings.enabled.keywords,
      avoidTerms:
        settings.enabled?.avoidTerms ?? defaultMunicipalAISettings.enabled.avoidTerms,
    },
  }
}

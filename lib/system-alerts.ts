import { buildProjectBudgetMap } from './project-budget'
import type { createClient } from './supabase-server'

export type AlertStatus =
  | 'Activa'
  | 'En Proceso'
  | 'Resuelta'
  | 'Vigente'
  | 'Por vencer'
  | 'Vencido'
  | 'Pendiente de pago'
  | 'Pagado'
  | 'En revisión'
  | 'Observada'
  | 'Rendido'
  | 'Sin estado'

export type AlertSeverity = 'Crítica' | 'Advertencia' | 'Informativa'

export type AlertHistoryItem = {
  id: string
  title: string
  date: string
  time: string
  description: string
  user: string
  tone: 'info' | 'purple' | 'green' | 'orange'
}

export type SystemAlert = {
  id: string
  proyectoId: string
  proyecto: string
  codigo: string
  descripcion: string
  estado: AlertStatus
  severidad: AlertSeverity
  detectedAt: string
  history: AlertHistoryItem[]
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type ProjectRow = {
  id: string
  codigo_interno: string | null
  nombre: string | null
  estado: string | null
  archivado: boolean | null
  created_at: string | null
  monto_estimado: number | string | null
}

type TipoAlertaRow = {
  id: string
  nombre: string
  modulo: string | null
  severidad: string | null
  descripcion: string | null
  activo: boolean | null
}

type GarantiaRow = {
  id: string
  proyecto_id: string
  tipo: string | null
  numero_documento: string | null
  fecha_vencimiento: string | null
  estado: string | null
}

type EstadoPagoRow = {
  id: string
  proyecto_id: string
  numero: number | string | null
  fecha: string | null
  monto: number | string | null
  estado: string | null
}

type RendicionRow = {
  id: string
  proyecto_id: string
  numero_rendicion: number | string | null
  fecha: string | null
  monto_rendido: number | string | null
  estado: string | null
}

type HistorialRow = {
  id: string
  entidad_id: string | null
  accion: string | null
  descripcion: string | null
  usuario_id: string | null
  created_at: string
}

type RuleConfig = {
  field: string
  operator: string
  value: number
  message: string
}

let activeAlertCountCache:
  | {
      expiresAt: number
      result: { count: number; error: string | null }
    }
  | null = null

export async function loadSystemAlerts(supabase: SupabaseClient) {
  const { data: proyectosData, error: proyectosError } = await supabase
    .from('proyectos')
    .select('id, codigo_interno, nombre, estado, archivado, created_at, monto_estimado')
    .eq('archivado', false)
    .order('created_at', { ascending: false })

  if (proyectosError) {
    return { alerts: [] as SystemAlert[], error: proyectosError.message }
  }

  const proyectos = (proyectosData ?? []) as ProjectRow[]
  const projectIds = proyectos.map((proyecto) => proyecto.id)

  if (projectIds.length === 0) {
    return { alerts: [] as SystemAlert[], error: null }
  }

  const [
    reglasRes,
    garantiasRes,
    estadosPagoRes,
    rendicionesRes,
    historialRes,
    fuentesProyectoRes,
    camposPresupuestoRes,
    respuestasPresupuestoRes,
  ] = await Promise.all([
    supabase
      .from('tipos_alerta')
      .select('id, nombre, modulo, severidad, descripcion, activo')
      .eq('activo', true),
    supabase
      .from('proyecto_garantias')
      .select('id, proyecto_id, tipo, numero_documento, fecha_vencimiento, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('proyecto_estados_pago')
      .select('id, proyecto_id, numero, fecha, monto, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('proyecto_rendiciones')
      .select('id, proyecto_id, numero_rendicion, fecha, monto_rendido, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('historial_eventos')
      .select('id, entidad_id, accion, descripcion, usuario_id, created_at')
      .in('entidad_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(240),
    supabase
      .from('proyecto_fuentes_financiamiento')
      .select('proyecto_id, fuente_id')
      .in('proyecto_id', projectIds),
    supabase
      .from('campos_formulario_fuente')
      .select('id, fuente_id, tipo')
      .eq('tipo', 'presupuesto')
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('proyecto_id, campo_id, valor_texto, valor_numero, valor_json')
      .in('proyecto_id', projectIds),
  ])

  const loadError =
    reglasRes.error ??
    garantiasRes.error ??
    estadosPagoRes.error ??
    rendicionesRes.error ??
    historialRes.error ??
    fuentesProyectoRes.error ??
    camposPresupuestoRes.error ??
    respuestasPresupuestoRes.error

  if (loadError) {
    return { alerts: [] as SystemAlert[], error: loadError.message }
  }

  const historial = (historialRes.data ?? []) as HistorialRow[]
  const userIds = Array.from(new Set(historial.map((item) => item.usuario_id).filter(Boolean)))
  const { data: perfilesData } = userIds.length
    ? await supabase.from('profiles').select('id, nombre_completo, email').in('id', userIds)
    : { data: [] }

  const perfiles = new Map(
    (perfilesData ?? []).map((perfil) => [
      perfil.id,
      perfil.nombre_completo || perfil.email || 'Usuario del sistema',
    ])
  )

  const presupuestoPorProyecto = buildProjectBudgetMap({
    projectIds,
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  })

  return {
    alerts: buildSystemAlerts({
      proyectos,
      reglas: (reglasRes.data ?? []) as TipoAlertaRow[],
      garantias: (garantiasRes.data ?? []) as GarantiaRow[],
      estadosPago: (estadosPagoRes.data ?? []) as EstadoPagoRow[],
      rendiciones: (rendicionesRes.data ?? []) as RendicionRow[],
      historial,
      perfiles,
      presupuestoPorProyecto,
    }),
    error: null,
  }
}

export function countActiveSystemAlerts(alerts: SystemAlert[]) {
  return alerts.length
}

export async function loadActiveSystemAlertCount(supabase: SupabaseClient) {
  if (activeAlertCountCache && activeAlertCountCache.expiresAt > Date.now()) {
    return activeAlertCountCache.result
  }

  const { data: proyectosData, error: proyectosError } = await supabase
    .from('proyectos')
    .select('id, codigo_interno, nombre, estado, archivado, created_at, monto_estimado')
    .eq('archivado', false)

  if (proyectosError) {
    return { count: 0, error: proyectosError.message }
  }

  const proyectos = (proyectosData ?? []) as ProjectRow[]
  const projectIds = proyectos.map((proyecto) => proyecto.id)

  if (projectIds.length === 0) {
    return cacheActiveAlertCount({ count: 0, error: null })
  }

  const [
    reglasRes,
    garantiasRes,
    estadosPagoRes,
    rendicionesRes,
    fuentesProyectoRes,
    camposPresupuestoRes,
    respuestasPresupuestoRes,
  ] = await Promise.all([
    supabase
      .from('tipos_alerta')
      .select('id, nombre, modulo, severidad, descripcion, activo')
      .eq('activo', true),
    supabase
      .from('proyecto_garantias')
      .select('id, proyecto_id, tipo, numero_documento, fecha_vencimiento, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('proyecto_estados_pago')
      .select('id, proyecto_id, numero, fecha, monto, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('proyecto_rendiciones')
      .select('id, proyecto_id, numero_rendicion, fecha, monto_rendido, estado')
      .in('proyecto_id', projectIds),
    supabase
      .from('proyecto_fuentes_financiamiento')
      .select('proyecto_id, fuente_id')
      .in('proyecto_id', projectIds),
    supabase
      .from('campos_formulario_fuente')
      .select('id, fuente_id, tipo')
      .eq('tipo', 'presupuesto')
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('proyecto_id, campo_id, valor_texto, valor_numero, valor_json')
      .in('proyecto_id', projectIds),
  ])

  const loadError =
    reglasRes.error ??
    garantiasRes.error ??
    estadosPagoRes.error ??
    rendicionesRes.error ??
    fuentesProyectoRes.error ??
    camposPresupuestoRes.error ??
    respuestasPresupuestoRes.error

  if (loadError) {
    return { count: 0, error: loadError.message }
  }

  const presupuestoPorProyecto = buildProjectBudgetMap({
    projectIds,
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  })

  const alerts = buildSystemAlerts({
    proyectos,
    reglas: (reglasRes.data ?? []) as TipoAlertaRow[],
    garantias: (garantiasRes.data ?? []) as GarantiaRow[],
    estadosPago: (estadosPagoRes.data ?? []) as EstadoPagoRow[],
    rendiciones: (rendicionesRes.data ?? []) as RendicionRow[],
    historial: [],
    perfiles: new Map(),
    presupuestoPorProyecto,
  })

  return cacheActiveAlertCount({ count: alerts.length, error: null })
}

function cacheActiveAlertCount(result: { count: number; error: string | null }) {
  activeAlertCountCache = {
    expiresAt: Date.now() + 15000,
    result,
  }

  return result
}

function buildSystemAlerts({
  proyectos,
  reglas,
  garantias,
  estadosPago,
  rendiciones,
  historial,
  perfiles,
  presupuestoPorProyecto,
}: {
  proyectos: ProjectRow[]
  reglas: TipoAlertaRow[]
  garantias: GarantiaRow[]
  estadosPago: EstadoPagoRow[]
  rendiciones: RendicionRow[]
  historial: HistorialRow[]
  perfiles: Map<string, string>
  presupuestoPorProyecto: Map<string, number | null>
}) {
  const today = startOfDay(new Date())
  const projectsById = new Map(proyectos.map((proyecto) => [proyecto.id, proyecto]))
  const historialByProject = groupBy(historial, (item) => item.entidad_id ?? '')
  const estadosPagoByProject = groupBy(estadosPago, (item) => item.proyecto_id)
  const rendicionesByProject = groupBy(rendiciones, (item) => item.proyecto_id)
  const activeRules = reglas
    .map(toRule)
    .filter(
      (rule): rule is ReturnType<typeof toRule> & { config: RuleConfig } =>
        Boolean(rule?.config)
    )
  const alerts: SystemAlert[] = []

  if (activeRules.length > 0) {
    for (const rule of activeRules) {
      if (!rule?.config) continue

      if (rule.config.field === 'dias_hasta_vencimiento_garantia') {
        for (const garantia of garantias) {
          const proyecto = projectsById.get(garantia.proyecto_id)
          if (!proyecto) continue

          const days = daysUntil(garantia.fecha_vencimiento, today)
          if (!matchesRule(days, rule.config)) continue

          alerts.push(
            createAlert({
              id: `${rule.id}-garantia-${garantia.id}`,
              proyecto,
              description:
                rule.config.message ||
                `${rule.nombre}: ${garantia.tipo || 'Garantía'} ${garantia.numero_documento || ''}`.trim(),
              severity: normalizeSeverity(rule.severidad),
              status: normalizeGarantiaStatus(garantia.estado, days),
              detectedAt: garantia.fecha_vencimiento ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: garantia.fecha_vencimiento,
                projectHistory: historialByProject.get(proyecto.id) ?? [],
                perfiles,
              }),
            })
          )
        }
      }

      if (rule.config.field === 'dias_estado_pago_pendiente') {
        for (const estadoPago of estadosPago.filter((item) => item.estado === 'pendiente_pago')) {
          const proyecto = projectsById.get(estadoPago.proyecto_id)
          if (!proyecto) continue

          const days = daysSince(estadoPago.fecha, today)
          if (!matchesRule(days, rule.config)) continue

          alerts.push(
            createAlert({
              id: `${rule.id}-estado-pago-${estadoPago.id}`,
              proyecto,
              description:
                rule.config.message ||
                `${rule.nombre}: estado de pago ${estadoPago.numero ?? ''}`.trim(),
              severity: normalizeSeverity(rule.severidad),
              status: 'En Proceso',
              detectedAt: estadoPago.fecha ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: estadoPago.fecha,
                projectHistory: historialByProject.get(proyecto.id) ?? [],
                perfiles,
              }),
            })
          )
        }
      }

      if (rule.config.field === 'dias_sin_rendicion') {
        for (const proyecto of proyectos) {
          const rendicionesProyecto = rendicionesByProject.get(proyecto.id) ?? []
          const latestRendicion = latestDate(rendicionesProyecto.map((item) => item.fecha))
          const referenceDate = latestRendicion ?? proyecto.created_at
          const days = daysSince(referenceDate, today)
          const hasOpenRendition = rendicionesProyecto.some((item) => item.estado !== 'rendido')

          if (
            !matchesRule(days, rule.config) ||
            (rendicionesProyecto.length > 0 && !hasOpenRendition)
          ) {
            continue
          }

          alerts.push(
            createAlert({
              id: `${rule.id}-rendicion-${proyecto.id}`,
              proyecto,
              description: rule.config.message || rule.nombre,
              severity: normalizeSeverity(rule.severidad),
              status: 'En Proceso',
              detectedAt: referenceDate ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: referenceDate,
                projectHistory: historialByProject.get(proyecto.id) ?? [],
                perfiles,
              }),
            })
          )
        }
      }

      if (rule.config.field === 'dias_sin_actualizacion') {
        for (const proyecto of proyectos) {
          const projectHistory = historialByProject.get(proyecto.id) ?? []
          const lastUpdate = projectHistory[0]?.created_at ?? proyecto.created_at
          const days = daysSince(lastUpdate, today)

          if (!matchesRule(days, rule.config)) continue

          alerts.push(
            createAlert({
              id: `${rule.id}-actualizacion-${proyecto.id}`,
              proyecto,
              description: rule.config.message || rule.nombre,
              severity: normalizeSeverity(rule.severidad),
              status: 'Activa',
              detectedAt: lastUpdate ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: lastUpdate,
                projectHistory,
                perfiles,
              }),
            })
          )
        }
      }

      if (rule.config.field === 'porcentaje_presupuesto_ejecutado') {
        for (const proyecto of proyectos) {
          const estadosProyecto = estadosPagoByProject.get(proyecto.id) ?? []
          const presupuesto =
            presupuestoPorProyecto.get(proyecto.id) ?? Number(proyecto.monto_estimado ?? 0)
          const totalPagado = estadosProyecto
            .filter((item) => item.estado === 'pagado')
            .reduce((total, item) => total + Number(item.monto ?? 0), 0)
          const porcentaje = presupuesto > 0 ? Math.round((totalPagado / presupuesto) * 100) : 0

          if (!matchesRule(porcentaje, rule.config)) continue

          alerts.push(
            createAlert({
              id: `${rule.id}-presupuesto-${proyecto.id}`,
              proyecto,
              description: rule.config.message || rule.nombre,
              severity: normalizeSeverity(rule.severidad),
              status: 'Activa',
              detectedAt: latestDate(estadosProyecto.map((item) => item.fecha)) ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: latestDate(estadosProyecto.map((item) => item.fecha)),
                projectHistory: historialByProject.get(proyecto.id) ?? [],
                perfiles,
              }),
            })
          )
        }
      }

      if (rule.config.field === 'dias_atraso_ejecucion') {
        for (const estadoPago of estadosPago.filter((item) => item.estado === 'pendiente_pago')) {
          const proyecto = projectsById.get(estadoPago.proyecto_id)
          if (!proyecto) continue

          const days = daysSince(estadoPago.fecha, today)
          if (!matchesRule(days, rule.config)) continue

          alerts.push(
            createAlert({
              id: `${rule.id}-atraso-${estadoPago.id}`,
              proyecto,
              description: rule.config.message || rule.nombre,
              severity: normalizeSeverity(rule.severidad),
              status: 'Activa',
              detectedAt: estadoPago.fecha ?? new Date().toISOString(),
              history: buildHistory({
                alertTitle: rule.nombre,
                detectedAt: estadoPago.fecha,
                projectHistory: historialByProject.get(proyecto.id) ?? [],
                perfiles,
              }),
            })
          )
        }
      }
    }
  } else {
    alerts.push(
      ...buildDefaultOperationalAlerts({
        proyectos,
        garantias,
        estadosPago,
        rendiciones,
        historialByProject,
        perfiles,
        today,
      })
    )
  }

  return alerts.sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt))
}

function buildDefaultOperationalAlerts({
  proyectos,
  garantias,
  estadosPago,
  rendiciones,
  historialByProject,
  perfiles,
  today,
}: {
  proyectos: ProjectRow[]
  garantias: GarantiaRow[]
  estadosPago: EstadoPagoRow[]
  rendiciones: RendicionRow[]
  historialByProject: Map<string, HistorialRow[]>
  perfiles: Map<string, string>
  today: Date
}) {
  const projectsById = new Map(proyectos.map((proyecto) => [proyecto.id, proyecto]))
  const alerts: SystemAlert[] = []

  for (const garantia of garantias) {
    const days = daysUntil(garantia.fecha_vencimiento, today)
    if (days > 30) continue

    const proyecto = projectsById.get(garantia.proyecto_id)
    if (!proyecto) continue

    alerts.push(
      createAlert({
        id: `garantia-${garantia.id}`,
        proyecto,
        description: days < 0 ? 'Garantía vencida' : 'Garantía por vencer',
        severity: days < 0 ? 'Crítica' : 'Advertencia',
        status: normalizeGarantiaStatus(garantia.estado, days),
        detectedAt: garantia.fecha_vencimiento ?? new Date().toISOString(),
        history: buildHistory({
          alertTitle: days < 0 ? 'Garantía vencida' : 'Garantía por vencer',
          detectedAt: garantia.fecha_vencimiento,
          projectHistory: historialByProject.get(proyecto.id) ?? [],
          perfiles,
        }),
      })
    )
  }

  for (const estadoPago of estadosPago.filter((item) => item.estado === 'pendiente_pago')) {
    const proyecto = projectsById.get(estadoPago.proyecto_id)
    if (!proyecto) continue

    alerts.push(
      createAlert({
        id: `estado-pago-${estadoPago.id}`,
        proyecto,
        description: `Estado de pago ${estadoPago.numero ?? ''} pendiente`.trim(),
        severity: 'Advertencia',
        status: 'En Proceso',
        detectedAt: estadoPago.fecha ?? new Date().toISOString(),
        history: buildHistory({
          alertTitle: 'Estado de pago pendiente',
          detectedAt: estadoPago.fecha,
          projectHistory: historialByProject.get(proyecto.id) ?? [],
          perfiles,
        }),
      })
    )
  }

  for (const rendicion of rendiciones.filter((item) => item.estado !== 'rendido')) {
    const proyecto = projectsById.get(rendicion.proyecto_id)
    if (!proyecto) continue

    alerts.push(
      createAlert({
        id: `rendicion-${rendicion.id}`,
        proyecto,
        description: `Rendición ${rendicion.numero_rendicion ?? ''} pendiente`.trim(),
        severity: rendicion.estado === 'observada' ? 'Crítica' : 'Advertencia',
        status: 'En Proceso',
        detectedAt: rendicion.fecha ?? new Date().toISOString(),
        history: buildHistory({
          alertTitle: 'Rendición pendiente',
          detectedAt: rendicion.fecha,
          projectHistory: historialByProject.get(proyecto.id) ?? [],
          perfiles,
        }),
      })
    )
  }

  return alerts
}

function createAlert({
  id,
  proyecto,
  description,
  severity,
  status,
  detectedAt,
  history,
}: {
  id: string
  proyecto: ProjectRow
  description: string
  severity: AlertSeverity
  status: AlertStatus
  detectedAt: string
  history: AlertHistoryItem[]
}): SystemAlert {
  return {
    id,
    proyectoId: proyecto.id,
    proyecto: proyecto.nombre || 'Proyecto sin nombre',
    codigo: proyecto.codigo_interno || proyecto.id.slice(0, 8),
    descripcion: description,
    estado: status,
    severidad: severity,
    detectedAt,
    history,
  }
}

function toRule(rule: TipoAlertaRow) {
  const config = parseRuleConfig(rule.descripcion)

  if (!config || !Number.isFinite(config.value)) return null

  return {
    id: rule.id,
    nombre: rule.nombre,
    modulo: rule.modulo,
    severidad: rule.severidad,
    config,
  }
}

function parseRuleConfig(raw?: string | null): RuleConfig | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<{
      kind: string
      field: string
      operator: string
      value: string | number
      message: string | null
    }>

    if (parsed.kind !== 'alert_rule' || !parsed.field || !parsed.operator) return null

    const value = Number(parsed.value)
    if (!Number.isFinite(value)) return null

    return {
      field: parsed.field,
      operator: parsed.operator,
      value,
      message: parsed.message ?? '',
    }
  } catch {
    return null
  }
}

function matchesRule(actualValue: number, rule: RuleConfig) {
  if (!Number.isFinite(actualValue)) return false

  if (rule.operator === '>') return actualValue > rule.value
  if (rule.operator === '>=') return actualValue >= rule.value
  if (rule.operator === '<') return actualValue < rule.value
  if (rule.operator === '<=') return actualValue <= rule.value
  if (rule.operator === '=') return actualValue === rule.value

  return false
}

function normalizeSeverity(severity?: string | null): AlertSeverity {
  if (severity === 'critica' || severity === 'alta') return 'Crítica'
  if (severity === 'informativa' || severity === 'baja') return 'Informativa'

  return 'Advertencia'
}

function normalizeGarantiaStatus(status?: string | null, daysUntilExpiration?: number): AlertStatus {
  if (status === 'vigente') return 'Vigente'
  if (status === 'por_vencer') return 'Por vencer'
  if (status === 'vencido') return 'Vencido'

  if (typeof daysUntilExpiration === 'number' && Number.isFinite(daysUntilExpiration)) {
    if (daysUntilExpiration < 0) return 'Vencido'
    if (daysUntilExpiration < 30) return 'Por vencer'
    return 'Vigente'
  }

  return 'Sin estado'
}

function buildHistory({
  alertTitle,
  detectedAt,
  projectHistory,
  perfiles,
}: {
  alertTitle: string
  detectedAt?: string | null
  projectHistory: HistorialRow[]
  perfiles: Map<string, string>
}): AlertHistoryItem[] {
  const generatedAt = detectedAt || new Date().toISOString()
  const items: AlertHistoryItem[] = [
    {
      id: `generated-${alertTitle}-${generatedAt}`,
      title: 'Alerta detectada',
      date: formatDate(generatedAt),
      time: formatTime(generatedAt),
      description: alertTitle,
      user: 'Sistema Automático',
      tone: 'info',
    },
  ]

  projectHistory.slice(0, 3).forEach((event, index) => {
    items.push({
      id: event.id,
      title: humanizeAction(event.accion || 'Evento registrado'),
      date: formatDate(event.created_at),
      time: formatTime(event.created_at),
      description: event.descripcion || 'Evento registrado en el proyecto.',
      user: event.usuario_id ? perfiles.get(event.usuario_id) ?? 'Usuario del sistema' : 'Sistema Automático',
      tone: index === 0 ? 'orange' : index === 1 ? 'green' : 'purple',
    })
  })

  return items
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>()

  for (const item of items) {
    const key = getKey(item)
    if (!key) continue

    const group = grouped.get(key) ?? []
    group.push(item)
    grouped.set(key, group)
  }

  return grouped
}

function latestDate(values: Array<string | null | undefined>) {
  const sorted = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))

  return sorted[0] ?? null
}

function daysUntil(value?: string | null, today = startOfDay(new Date())) {
  if (!value) return Number.POSITIVE_INFINITY

  return Math.ceil((startOfDay(new Date(value)).getTime() - today.getTime()) / 86400000)
}

function daysSince(value?: string | null, today = startOfDay(new Date())) {
  if (!value) return 0

  return Math.max(0, Math.floor((today.getTime() - startOfDay(new Date(value)).getTime()) / 86400000))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  }).format(date)
}

function humanizeAction(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

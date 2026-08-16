import AppShell from '../../components/AppShell'
import AccessDenied from '../../components/AccessDenied'
import DashboardView, {
  type DashboardAlertItem,
  type DashboardEstadoPagoItem,
  type DashboardGarantiaItem,
  type DashboardProjectItem,
  type DashboardRendicionItem,
} from '../../components/dashboard/DashboardView'
import { createClient } from '../../lib/supabase-server'
import { buildProjectBudgetMap } from '../../lib/project-budget'
import { loadSystemAlerts } from '../../lib/system-alerts'
import { PERMISSIONS, requirePermission } from '../../lib/auth-guards'

type RawProject = Omit<DashboardProjectItem, 'presupuesto_total' | 'fuenteNombre'> & {
  fuente: { nombre?: string | null } | { nombre?: string | null }[] | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.dashboardView)

  if (!access.success) {
    return (
      <AppShell title="Dashboard" currentModule="dashboard" showTitle>
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const [proyectosRes, estadosPagoRes, rendicionesRes, garantiasRes, alertasRes] =
    await Promise.all([
      supabase
        .from('proyectos')
        .select(
          'id, codigo_interno, nombre, estado, monto_estimado, porcentaje_formulacion, avance_fisico_actual, avance_financiero_actual, created_at, anio_inicio, fuente:fuentes_financiamiento(nombre)'
        )
        .eq('archivado', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('proyecto_estados_pago')
        .select('proyecto_id, monto, avance_fisico, estado'),
      supabase
        .from('proyecto_rendiciones')
        .select('proyecto_id, monto_rendido, estado'),
      supabase
        .from('proyecto_garantias')
        .select('proyecto_id, fecha_vencimiento, estado'),
      loadSystemAlerts(supabase),
    ])

  const error =
    proyectosRes.error ??
    estadosPagoRes.error ??
    rendicionesRes.error ??
    garantiasRes.error

  if (error) {
    return (
      <AppShell title="Dashboard" currentModule="dashboard" showTitle>
        <div
          style={{
            background: '#fff',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 16,
            padding: 20,
          }}
        >
          Error al cargar el dashboard: {error.message}
        </div>
      </AppShell>
    )
  }

  const rawProjects = (proyectosRes.data ?? []) as RawProject[]
  const projectIds = rawProjects.map((project) => project.id)

  const [fuentesProyectoRes, camposPresupuestoRes, respuestasPresupuestoRes] =
    projectIds.length > 0
      ? await Promise.all([
          supabase
            .from('proyecto_fuentes_financiamiento')
            .select('proyecto_id, fuente_id')
            .in('proyecto_id', projectIds),
          supabase
            .from('campos_formulario_fuente')
            .select('id, fuente_id, tipo')
            .in('tipo', ['presupuesto', 'tabla_presupuesto'])
            .eq('visible', true),
          supabase
            .from('proyecto_postulacion_respuestas')
            .select('proyecto_id, campo_id, valor_texto, valor_numero, valor_json')
            .in('proyecto_id', projectIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }]

  const presupuestoPorProyecto = buildProjectBudgetMap({
    projectIds,
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  })

  const proyectos: DashboardProjectItem[] = rawProjects.map((project) => ({
    ...project,
    presupuesto_total:
      presupuestoPorProyecto.get(project.id) ?? Number(project.monto_estimado ?? 0),
    fuenteNombre: extractFuenteNombre(project.fuente),
  }))

  const estadosPago = (estadosPagoRes.data ?? []) as DashboardEstadoPagoItem[]
  const rendiciones = (rendicionesRes.data ?? []) as DashboardRendicionItem[]
  const garantias = (garantiasRes.data ?? []) as DashboardGarantiaItem[]
  const alertas = (alertasRes.alerts ?? []) as DashboardAlertItem[]

  return (
    <AppShell title="Dashboard" currentModule="dashboard" showTitle>
      <DashboardView
        projects={proyectos}
        estadosPago={estadosPago}
        rendiciones={rendiciones}
        garantias={garantias}
        alerts={alertas}
      />
    </AppShell>
  )
}

function extractFuenteNombre(
  value: { nombre?: string | null } | { nombre?: string | null }[] | null
) {
  if (!value) return 'Sin fuente'
  if (Array.isArray(value)) return value[0]?.nombre ?? 'Sin fuente'
  return value.nombre ?? 'Sin fuente'
}

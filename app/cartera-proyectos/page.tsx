import AppShell from '../../components/AppShell'
import AccessDenied from '../../components/AccessDenied'
import { createClient } from '../../lib/supabase-server'
import CarteraContainer from '../../components/cartera-proyectos/CarteraContainer'
import { buildProjectBudgetMap } from '../../lib/project-budget'
import { hasPermission, PERMISSIONS, requirePermission } from '../../lib/auth-guards'

export type ProyectoCartera = {
  id: string
  codigo_interno: string | null
  nombre: string
  anio_inicio: number | null
  monto_estimado: number | null
  presupuesto_total: number | null
  avance_fisico_actual: number | null
  avance_financiero_actual: number | null
  porcentaje_formulacion: number | null
  estado: string | null
  activo: boolean | null
  archivado: boolean | null
  unidad: { nombre: string } | null
  fuente: { nombre: string } | null
  responsable: { nombre_completo: string } | null
}

type ProyectoCarteraRaw = Omit<ProyectoCartera, 'unidad' | 'fuente' | 'responsable'> & {
  unidad: { nombre: string } | { nombre: string }[] | null
  fuente: { nombre: string } | { nombre: string }[] | null
  responsable: { nombre_completo: string } | { nombre_completo: string }[] | null
}

export default async function CarteraProyectosPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const access = await requirePermission(supabase, [
    PERMISSIONS.proyectosView,
    PERMISSIONS.ejecucionView,
    PERMISSIONS.financiamientoView,
    PERMISSIONS.rendicionesView,
    PERMISSIONS.garantiasView,
    PERMISSIONS.proveedoresView,
    PERMISSIONS.bitacoraView,
    PERMISSIONS.historialView,
  ])

  if (!access.success) {
    return (
      <AppShell title="Cartera de Proyectos" currentModule="cartera-proyectos">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const { data, error } = await supabase
    .from('proyectos')
    .select(`
      id,
      codigo_interno,
      nombre,
      anio_inicio,
      monto_estimado,
      avance_fisico_actual,
      avance_financiero_actual,
      porcentaje_formulacion,
      estado,
      activo,
      archivado,
      unidad:unidades(nombre),
      fuente:fuentes_financiamiento(nombre),
      responsable:profiles!proyectos_responsable_id_fkey(nombre_completo)
    `)
    .eq('archivado', false)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <AppShell title="Cartera de Proyectos" currentModule="cartera-proyectos">
        <div
          style={{
            background: '#fff',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 16,
            padding: 20,
          }}
        >
          Error al cargar la cartera de proyectos: {error.message}
        </div>
      </AppShell>
    )
  }

  const rawProjects = (data ?? []) as ProyectoCarteraRaw[]
  const projectIds = rawProjects.map((proyecto) => proyecto.id)
  const [
    fuentesProyectoRes,
    camposPresupuestoRes,
    respuestasPresupuestoRes,
    estadosPagoRes,
    transferenciasRes,
    rendicionesRes,
  ] =
    projectIds.length
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
          supabase
            .from('proyecto_estados_pago')
            .select('proyecto_id, monto, avance_fisico, estado')
            .in('proyecto_id', projectIds),
          supabase
            .from('proyecto_transferencias')
            .select('proyecto_id, monto')
            .in('proyecto_id', projectIds),
          supabase
            .from('proyecto_rendiciones')
            .select('proyecto_id, monto_rendido')
            .in('proyecto_id', projectIds),
        ])
      : [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
        ]

  const presupuestoPorProyecto = buildProjectBudgetMap({
    projectIds,
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  })

  const estadosPagoPorProyecto = groupByProjectId(estadosPagoRes.data ?? [])
  const transferenciasPorProyecto = groupByProjectId(transferenciasRes.data ?? [])
  const rendicionesPorProyecto = groupByProjectId(rendicionesRes.data ?? [])

  const proyectos: ProyectoCartera[] = rawProjects.map((p) => ({
    ...p,
    presupuesto_total: presupuestoPorProyecto.get(p.id) ?? null,
    avance_fisico_actual: calcularAvanceFisico(estadosPagoPorProyecto.get(p.id) ?? []),
    avance_financiero_actual: calcularAvanceFinanciero({
      estadosPago: estadosPagoPorProyecto.get(p.id) ?? [],
      transferencias: transferenciasPorProyecto.get(p.id) ?? [],
      rendiciones: rendicionesPorProyecto.get(p.id) ?? [],
      presupuestoTotal: Number(
        presupuestoPorProyecto.get(p.id) ?? p.monto_estimado ?? 0
      ),
    }),
    unidad: Array.isArray(p.unidad) ? p.unidad[0] ?? null : p.unidad,
    fuente: Array.isArray(p.fuente) ? p.fuente[0] ?? null : p.fuente,
    responsable: Array.isArray(p.responsable)
      ? p.responsable[0] ?? null
      : p.responsable,
  }))

  return (
    <AppShell title="Cartera de Proyectos" currentModule="cartera-proyectos">
      <CarteraContainer
        proyectos={proyectos}
        initialSearch={resolvedSearchParams?.search ?? ''}
        canDeleteProjects={access.isAdmin || hasPermission(access, PERMISSIONS.administracionManage)}
      />
    </AppShell>
  )
}

function groupByProjectId<
  T extends {
    proyecto_id?: string | null
  },
>(rows: T[]) {
  const grouped = new Map<string, T[]>()

  for (const row of rows) {
    const projectId = row.proyecto_id
    if (!projectId) continue

    const current = grouped.get(projectId) ?? []
    current.push(row)
    grouped.set(projectId, current)
  }

  return grouped
}

function calcularAvanceFisico(
  estadosPago: Array<{ avance_fisico?: number | string | null }>
) {
  const avances = estadosPago
    .map((estadoPago) => Number(estadoPago.avance_fisico ?? 0))
    .filter((avance) => Number.isFinite(avance))

  if (avances.length === 0) return 0

  return clampPercentage(Math.max(...avances))
}

function calcularAvanceFinanciero({
  estadosPago,
  transferencias,
  rendiciones,
  presupuestoTotal,
}: {
  estadosPago: Array<{ monto?: number | string | null; estado?: string | null }>
  transferencias: Array<{ monto?: number | string | null }>
  rendiciones: Array<{ monto_rendido?: number | string | null }>
  presupuestoTotal: number
}) {
  if (!presupuestoTotal || presupuestoTotal <= 0) return 0

  const totalPagado = estadosPago
    .filter((estadoPago) => estadoPago.estado === 'pagado')
    .reduce((total, estadoPago) => total + Number(estadoPago.monto ?? 0), 0)

  const totalTransferido = transferencias.reduce(
    (total, transferencia) => total + Number(transferencia.monto ?? 0),
    0
  )

  const totalRendido = rendiciones.reduce(
    (total, rendicion) => total + Number(rendicion.monto_rendido ?? 0),
    0
  )

  const montoEjecutadoActual = Math.max(totalPagado, totalTransferido, totalRendido)

  return clampPercentage(Math.round((montoEjecutadoActual / presupuestoTotal) * 100))
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0

  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

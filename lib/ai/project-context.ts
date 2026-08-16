import { buildProjectBudgetMap } from '../project-budget'
import {
  hasPermission,
  PERMISSIONS,
  type Authorization,
} from '../auth-guards'
import type { createClient } from '../supabase-server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type ProjectAIContext = {
  generatedAt: string
  deniedSections: string[]
  permissions: {
    proyectos: boolean
    ejecucion: boolean
    financiamiento: boolean
    rendiciones: boolean
    garantias: boolean
    proveedores: boolean
    bitacora: boolean
    historial: boolean
  }
  proyecto: {
    id: string
    codigo: string
    nombre: string
    estado: string
    unidad: string
    responsable: string
    fuente: string
    anioInicio: string
    montoEstimado: number
    presupuestoTotal: number
    avanceFisico: number
    avanceFinanciero: number
    porcentajeFormulacion: number
  }
  formulacion?: {
    descripcion: string
    poblacionBeneficiaria: JsonValue
    diagnostico: {
      problemaCentral: string
      justificacion: string
    } | null
    documentos: {
      fuente: string
      requeridos: Array<{ id: string; nombre: string; obligatorio: boolean }>
      cargados: Array<{ nombre: string; requisitoId: string; estado: string }>
      faltantes: Array<{ id: string; nombre: string }>
    }
  }
  ejecucion?: {
    estadosPago: Array<{
      numero: string
      fecha: string
      monto: number
      avanceFisico: number
      estado: string
    }>
    pagosPendientes: number
    totalPagado: number
  }
  financiamiento?: {
    transferencias: Array<{
      concepto: string
      fecha: string
      monto: number
      estado: string
    }>
    totalTransferido: number
  }
  rendiciones?: {
    rendiciones: Array<{
      numero: string
      fecha: string
      monto: number
      estado: string
      documentos: number
    }>
    abiertas: number
    observadas: number
    totalRendido: number
  }
  garantias?: {
    garantias: Array<{
      tipo: string
      numero: string
      vencimiento: string
      estado: string
      diasParaVencer: number | null
    }>
    vencidas: number
    porVencer: number
  }
  proveedores?: {
    proveedores: Array<{
      nombre: string
      tipo: string
      servicio: string
      contratacion: string
    }>
  }
  bitacora?: {
    entradas: Array<{
      tipo: string
      titulo: string
      descripcion: string
      fecha: string
    }>
  }
  historial?: {
    eventos: Array<{
      accion: string
      descripcion: string
      fecha: string
    }>
  }
}

export async function buildProjectAIContext({
  supabase,
  projectId,
  authorization,
}: {
  supabase: SupabaseClient
  projectId: string
  authorization: Authorization
}): Promise<{ success: true; context: ProjectAIContext } | { success: false; error: string }> {
  const can = {
    proyectos: hasPermission(authorization, PERMISSIONS.proyectosView),
    ejecucion: hasPermission(authorization, PERMISSIONS.ejecucionView),
    financiamiento: hasPermission(authorization, PERMISSIONS.financiamientoView),
    rendiciones: hasPermission(authorization, PERMISSIONS.rendicionesView),
    garantias: hasPermission(authorization, PERMISSIONS.garantiasView),
    proveedores: hasPermission(authorization, PERMISSIONS.proveedoresView),
    bitacora: hasPermission(authorization, PERMISSIONS.bitacoraView),
    historial: hasPermission(authorization, [PERMISSIONS.historialView, PERMISSIONS.proyectosView]),
  }

  const deniedSections = Object.entries(can)
    .filter(([, allowed]) => !allowed)
    .map(([section]) => section)

  const { data: proyecto, error: proyectoError } = await supabase
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
      unidad:unidades(nombre),
      fuente:fuentes_financiamiento(nombre),
      responsable:profiles!proyectos_responsable_id_fkey(nombre_completo)
    `)
    .eq('id', projectId)
    .maybeSingle()

  if (proyectoError || !proyecto) {
    return {
      success: false,
      error: proyectoError?.message || 'No se encontró el proyecto.',
    }
  }

  const [
    fuentesProyectoRes,
    camposPresupuestoRes,
    respuestasPresupuestoRes,
    estadosPagoRes,
    transferenciasRes,
    rendicionesRes,
  ] = await Promise.all([
    supabase
      .from('proyecto_fuentes_financiamiento')
      .select('proyecto_id, fuente_id, fuente:fuentes_financiamiento(nombre)')
      .eq('proyecto_id', projectId),
    supabase
      .from('campos_formulario_fuente')
      .select('id, fuente_id, tipo')
      .in('tipo', ['presupuesto', 'tabla_presupuesto'])
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('proyecto_id, campo_id, valor_texto, valor_numero, valor_json')
      .eq('proyecto_id', projectId),
    supabase
      .from('proyecto_estados_pago')
      .select('monto, avance_fisico, estado')
      .eq('proyecto_id', projectId),
    supabase
      .from('proyecto_transferencias')
      .select('monto')
      .eq('proyecto_id', projectId),
    supabase
      .from('proyecto_rendiciones')
      .select('monto_rendido')
      .eq('proyecto_id', projectId),
  ])

  const presupuesto = buildProjectBudgetMap({
    projectIds: [projectId],
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  }).get(projectId)
  const presupuestoTotal = Number(presupuesto ?? proyecto.monto_estimado ?? 0)
  const avanceFisicoCalculado = calcularAvanceFisico(estadosPagoRes.data ?? [])
  const avanceFinancieroCalculado = calcularAvanceFinanciero({
    estadosPago: estadosPagoRes.data ?? [],
    transferencias: transferenciasRes.data ?? [],
    rendiciones: (rendicionesRes.data ?? []).map((item) => ({ monto: item.monto_rendido })),
    presupuestoTotal,
  })

  const fuenteSeleccionada = fuentesProyectoRes.data?.[0]
  const context: ProjectAIContext = {
    generatedAt: new Date().toISOString(),
    deniedSections,
    permissions: can,
    proyecto: {
      id: proyecto.id,
      codigo: proyecto.codigo_interno || proyecto.id.slice(0, 8),
      nombre: proyecto.nombre || 'Proyecto sin nombre',
      estado: proyecto.estado || 'Sin estado',
      unidad: extractName(proyecto.unidad),
      responsable: extractName(proyecto.responsable, 'nombre_completo'),
      fuente: extractName(fuenteSeleccionada?.fuente) || extractName(proyecto.fuente),
      anioInicio: String(proyecto.anio_inicio ?? '-'),
      montoEstimado: Number(proyecto.monto_estimado ?? 0),
      presupuestoTotal,
      avanceFisico: avanceFisicoCalculado,
      avanceFinanciero: avanceFinancieroCalculado,
      porcentajeFormulacion: Number(proyecto.porcentaje_formulacion ?? 0),
    },
  }

  if (can.proyectos) {
    context.formulacion = await buildFormulationContext({
      supabase,
      projectId,
      fuenteId: fuenteSeleccionada?.fuente_id ?? '',
      fuenteNombre: extractName(fuenteSeleccionada?.fuente) || extractName(proyecto.fuente),
    })
  }

  if (can.ejecucion) {
    context.ejecucion = await buildExecutionContext(supabase, projectId)
  }

  if (can.financiamiento) {
    context.financiamiento = await buildFundingContext(supabase, projectId)
  }

  if (can.rendiciones) {
    context.rendiciones = await buildRenditionsContext(supabase, projectId)
  }

  if (can.garantias) {
    context.garantias = await buildGuaranteesContext(supabase, projectId)
  }

  if (can.proveedores) {
    context.proveedores = await buildProvidersContext(supabase, projectId)
  }

  if (can.bitacora) {
    context.bitacora = await buildBitacoraContext(supabase, projectId)
  }

  if (can.historial) {
    context.historial = await buildHistoryContext(supabase, projectId)
  }

  return { success: true, context }
}

async function buildFormulationContext({
  supabase,
  projectId,
  fuenteId,
  fuenteNombre,
}: {
  supabase: SupabaseClient
  projectId: string
  fuenteId: string
  fuenteNombre: string
}) {
  const [
    datosGeneralesRes,
    diagnosticoRes,
    requeridosRes,
    documentosRes,
  ] = await Promise.all([
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion, poblacion_beneficiaria')
      .eq('proyecto_id', projectId)
      .maybeSingle(),
    supabase
      .from('proyecto_diagnostico')
      .select('problema_central, justificacion')
      .eq('proyecto_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1),
    fuenteId
      ? supabase
          .from('documentos_fuente')
          .select('id, nombre, obligatorio')
          .eq('fuente_id', fuenteId)
          .order('orden', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('documentos_proyecto')
      .select('nombre, catalogo_documento_id, observacion, estado_revision')
      .eq('proyecto_id', projectId)
      .eq('etapa', 'documentos'),
  ])

  const requeridos = (requeridosRes.data ?? []).map((doc) => ({
    id: doc.id,
    nombre: doc.nombre,
    obligatorio: Boolean(doc.obligatorio),
  }))
  const cargados = (documentosRes.data ?? []).map((doc) => ({
    nombre: doc.nombre || 'Documento sin nombre',
    requisitoId: getRequirementId(doc),
    estado: doc.estado_revision || 'sin_estado',
  }))
  const cargadosIds = new Set(cargados.map((doc) => doc.requisitoId).filter(Boolean))
  const faltantes = requeridos
    .filter((doc) => doc.obligatorio)
    .filter((doc) => !cargadosIds.has(doc.id))
    .map((doc) => ({ id: doc.id, nombre: doc.nombre }))

  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data ?? null

  return {
    descripcion: datosGeneralesRes.data?.descripcion ?? '',
    poblacionBeneficiaria: (datosGeneralesRes.data?.poblacion_beneficiaria ?? null) as JsonValue,
    diagnostico: diagnostico
      ? {
          problemaCentral: diagnostico.problema_central || '',
          justificacion: diagnostico.justificacion || '',
        }
      : null,
    documentos: {
      fuente: fuenteNombre || 'Sin fuente seleccionada',
      requeridos,
      cargados,
      faltantes,
    },
  }
}

async function buildExecutionContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('proyecto_estados_pago')
    .select('numero, fecha, monto, avance_fisico, estado')
    .eq('proyecto_id', projectId)
    .order('numero', { ascending: true })

  const estadosPago = (data ?? []).map((item) => ({
    numero: String(item.numero ?? '-'),
    fecha: item.fecha ?? '-',
    monto: Number(item.monto ?? 0),
    avanceFisico: Number(item.avance_fisico ?? 0),
    estado: item.estado ?? 'sin_estado',
  }))

  return {
    estadosPago,
    pagosPendientes: estadosPago.filter((item) => item.estado !== 'pagado').length,
    totalPagado: estadosPago
      .filter((item) => item.estado === 'pagado')
      .reduce((total, item) => total + item.monto, 0),
  }
}

async function buildFundingContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('proyecto_transferencias')
    .select('concepto, fecha, monto, estado')
    .eq('proyecto_id', projectId)
    .order('created_at', { ascending: false })

  const transferencias = (data ?? []).map((item) => ({
    concepto: item.concepto ?? '-',
    fecha: item.fecha ?? '-',
    monto: Number(item.monto ?? 0),
    estado: item.estado ?? 'sin_estado',
  }))

  return {
    transferencias,
    totalTransferido: transferencias.reduce((total, item) => total + item.monto, 0),
  }
}

async function buildRenditionsContext(supabase: SupabaseClient, projectId: string) {
  const [rendicionesRes, documentosRes] = await Promise.all([
    supabase
      .from('proyecto_rendiciones')
      .select('id, numero_rendicion, fecha, monto_rendido, estado')
      .eq('proyecto_id', projectId)
      .order('numero_rendicion', { ascending: true }),
    supabase
      .from('documentos_proyecto')
      .select('observacion')
      .eq('proyecto_id', projectId)
      .eq('etapa', 'rendicion'),
  ])

  const documentosPorRendicion = new Map<string, number>()
  for (const documento of documentosRes.data ?? []) {
    const rendicionId = extractPrefixedId(documento.observacion, 'rendicion_id:')
    if (!rendicionId) continue
    documentosPorRendicion.set(rendicionId, (documentosPorRendicion.get(rendicionId) ?? 0) + 1)
  }

  const rendiciones = (rendicionesRes.data ?? []).map((item) => ({
    numero: String(item.numero_rendicion ?? '-'),
    fecha: item.fecha ?? '-',
    monto: Number(item.monto_rendido ?? 0),
    estado: item.estado ?? 'sin_estado',
    documentos: documentosPorRendicion.get(item.id) ?? 0,
  }))

  return {
    rendiciones,
    abiertas: rendiciones.filter((item) => item.estado !== 'rendido').length,
    observadas: rendiciones.filter((item) => item.estado === 'observada').length,
    totalRendido: rendiciones.reduce((total, item) => total + item.monto, 0),
  }
}

async function buildGuaranteesContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('proyecto_garantias')
    .select('tipo, numero_documento, fecha_vencimiento, estado')
    .eq('proyecto_id', projectId)
    .order('fecha_vencimiento', { ascending: true })

  const today = startOfDay(new Date())
  const garantias = (data ?? []).map((item) => {
    const dias = daysUntil(item.fecha_vencimiento, today)
    return {
      tipo: item.tipo ?? '-',
      numero: item.numero_documento ?? '-',
      vencimiento: item.fecha_vencimiento ?? '-',
      estado: item.estado ?? 'sin_estado',
      diasParaVencer: Number.isFinite(dias) ? dias : null,
    }
  })

  return {
    garantias,
    vencidas: garantias.filter((item) => (item.diasParaVencer ?? 1) < 0).length,
    porVencer: garantias.filter((item) => {
      const dias = item.diasParaVencer
      return dias !== null && dias >= 0 && dias < 30
    }).length,
  }
}

async function buildProvidersContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('proyecto_bitacora')
    .select('titulo, metadata')
    .eq('proyecto_id', projectId)
    .eq('tipo', 'proveedor')
    .order('created_at', { ascending: false })

  return {
    proveedores: (data ?? []).map((item) => {
      const metadata = (item.metadata ?? {}) as {
        tipo_proveedor?: string
        contratacion?: { tipo_contratacion?: string }
        servicio?: { tipo_servicio?: string; descripcion_servicio?: string }
      }

      return {
        nombre: item.titulo ?? 'Proveedor sin nombre',
        tipo: metadata.tipo_proveedor ?? '-',
        servicio: metadata.servicio?.descripcion_servicio || metadata.servicio?.tipo_servicio || '-',
        contratacion: metadata.contratacion?.tipo_contratacion ?? '-',
      }
    }),
  }
}

async function buildBitacoraContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('proyecto_bitacora')
    .select('tipo, titulo, descripcion, created_at')
    .eq('proyecto_id', projectId)
    .neq('tipo', 'proveedor')
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    entradas: (data ?? []).map((item) => ({
      tipo: item.tipo ?? '-',
      titulo: item.titulo ?? '-',
      descripcion: item.descripcion ?? '-',
      fecha: item.created_at ?? '-',
    })),
  }
}

async function buildHistoryContext(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from('historial_eventos')
    .select('accion, descripcion, created_at')
    .eq('entidad_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    eventos: (data ?? []).map((item) => ({
      accion: item.accion ?? '-',
      descripcion: item.descripcion ?? '-',
      fecha: item.created_at ?? '-',
    })),
  }
}

function extractName(
  value:
    | { nombre?: string | null; nombre_completo?: string | null }
    | Array<{ nombre?: string | null; nombre_completo?: string | null }>
    | null
    | undefined,
  key: 'nombre' | 'nombre_completo' = 'nombre'
) {
  const item = Array.isArray(value) ? value[0] : value
  return item?.[key] || item?.nombre || item?.nombre_completo || ''
}

function getRequirementId(documento: {
  catalogo_documento_id?: string | null
  observacion?: string | null
}) {
  if (documento.catalogo_documento_id) return documento.catalogo_documento_id
  return extractPrefixedId(documento.observacion, 'documento_fuente_id:')
}

function extractPrefixedId(value: string | null | undefined, prefix: string) {
  if (!value?.startsWith(prefix)) return ''
  return value.slice(prefix.length)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysUntil(value?: string | null, today = startOfDay(new Date())) {
  if (!value) return Number.POSITIVE_INFINITY

  return Math.ceil((startOfDay(new Date(value)).getTime() - today.getTime()) / 86400000)
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
  rendiciones: Array<{ monto?: number | string | null }>
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
    (total, rendicion) => total + Number(rendicion.monto ?? 0),
    0
  )

  const baseFinanciera = Math.max(totalPagado, totalTransferido, totalRendido)

  return clampPercentage(Math.round((baseFinanciera / presupuestoTotal) * 100))
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.max(0, Math.min(100, Math.round(value)))
}

import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import ProyectoHeader from '../../../components/ficha-proyecto/ProyectoHeader'
import ProyectoTabs from '../../../components/ficha-proyecto/ProyectoTabs'
import ProjectAIAssistant from '../../../components/ficha-proyecto/ProjectAIAssistant'
import { getProjectVisualization } from '../../../lib/ai/project-visualizations'
import { buildProjectBudgetMap } from '../../../lib/project-budget'
import { PERMISSIONS, hasPermission, requirePermission } from '../../../lib/auth-guards'
import type { DocumentoEstadoPago, PagoProveedorEstadoPago } from '../../../lib/project-types'

export default async function ProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const supabase = await createClient()
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
      <AppShell title="Ficha del Proyecto" currentModule="cartera-proyectos">
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
      created_at,
      responsable_id,
      unidad_id,
      fuente_financiamiento_id,
      unidad:unidades(nombre),
      fuente:fuentes_financiamiento(nombre),
      responsable:profiles!proyectos_responsable_id_fkey(nombre_completo)
    `)
    .eq('id', resolvedParams.id)
    .maybeSingle()

  const [{ data: datosGenerales }, visualization] = await Promise.all([
    supabase
      .from('proyecto_datos_generales')
      .select('descripcion')
      .eq('proyecto_id', resolvedParams.id)
      .maybeSingle(),
    getProjectVisualization(resolvedParams.id),
  ])

  const { data: transferenciasData } = await supabase
  .from('proyecto_transferencias')
  .select('*')
  .eq('proyecto_id', resolvedParams.id)
  .order('created_at', { ascending: false })

  const { data: garantiasData } = await supabase
  .from('proyecto_garantias')
  .select('*')
  .eq('proyecto_id', resolvedParams.id)
  .order('fecha_vencimiento', { ascending: true })

  const { data: estadosPagoData } = await supabase
  .from('proyecto_estados_pago')
  .select('*')
  .eq('proyecto_id', resolvedParams.id)
  .order('numero', { ascending: true })

  const { data: documentosEjecucionData } = await supabase
  .from('documentos_proyecto')
  .select('id, nombre, nombre_archivo, fecha_subida, observacion, ruta_storage, bucket')
  .eq('proyecto_id', resolvedParams.id)
  .eq('etapa', 'ejecucion')
  .order('fecha_subida', { ascending: false })

  const { data: documentosFinanciamientoData } = await supabase
  .from('documentos_proyecto')
  .select('id, nombre, nombre_archivo, fecha_subida, observacion, ruta_storage, bucket')
  .eq('proyecto_id', resolvedParams.id)
  .eq('etapa', 'financiamiento')
  .order('fecha_subida', { ascending: false })

  const { data: documentosRendicionData } = await supabase
  .from('documentos_proyecto')
  .select('id, nombre, nombre_archivo, fecha_subida, observacion, ruta_storage, bucket')
  .eq('proyecto_id', resolvedParams.id)
  .eq('etapa', 'rendicion')
  .order('fecha_subida', { ascending: false })

  const { data: documentosGarantiaData } = await supabase
  .from('documentos_proyecto')
  .select('id, nombre, nombre_archivo, fecha_subida, observacion, ruta_storage, bucket')
  .eq('proyecto_id', resolvedParams.id)
  .eq('etapa', 'garantias')
  .order('fecha_subida', { ascending: false })

  const { data: documentosBitacoraData } = await supabase
  .from('documentos_proyecto')
  .select('id, nombre, nombre_archivo, fecha_subida, observacion, ruta_storage, bucket')
  .eq('proyecto_id', resolvedParams.id)
  .eq('etapa', 'bitacora')
  .order('fecha_subida', { ascending: false })

  const { data: rendicionesData } = await supabase
  .from('proyecto_rendiciones')
  .select('*')
  .eq('proyecto_id', resolvedParams.id)
  .order('numero_rendicion', { ascending: true })

  const { data: historialData } = await supabase
  .from('historial_eventos')
  .select('*')
  .eq('entidad_id', resolvedParams.id)
  .order('created_at', { ascending: false })

  const { data: bitacoraData } = await supabase
  .from('proyecto_bitacora')
  .select('*')
  .eq('proyecto_id', resolvedParams.id)
  .order('created_at', { ascending: false })

  const bitacoraUserIds = Array.from(
    new Set((bitacoraData ?? []).map((item) => item.usuario_id).filter(Boolean))
  )

  const { data: perfilesBitacoraData } = bitacoraUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, nombre_completo')
        .in('id', bitacoraUserIds)
    : { data: [] }

  const [
    fuentesProyectoRes,
    camposPresupuestoRes,
    respuestasPresupuestoRes,
  ] = await Promise.all([
    supabase
      .from('proyecto_fuentes_financiamiento')
      .select('proyecto_id, fuente_id')
      .eq('proyecto_id', resolvedParams.id),
    supabase
      .from('campos_formulario_fuente')
      .select('id, fuente_id, tipo')
      .eq('tipo', 'presupuesto')
      .eq('visible', true),
    supabase
      .from('proyecto_postulacion_respuestas')
      .select('proyecto_id, campo_id, valor_texto, valor_numero, valor_json')
      .eq('proyecto_id', resolvedParams.id),
  ])

  const presupuestoPorProyecto = buildProjectBudgetMap({
    projectIds: [resolvedParams.id],
    fundingSelections: fuentesProyectoRes.data ?? [],
    budgetFields: camposPresupuestoRes.data ?? [],
    responses: respuestasPresupuestoRes.data ?? [],
  })

  const presupuestoTotal = presupuestoPorProyecto.get(resolvedParams.id) ?? null
  const avanceFisicoCalculado = calcularAvanceFisico(estadosPagoData ?? [])
  const montoEjecutadoActual = calcularMontoEjecutadoActual({
    estadosPago: estadosPagoData ?? [],
    transferencias: transferenciasData ?? [],
    rendiciones: rendicionesData ?? [],
  })
  const avanceFinancieroCalculado = calcularAvanceFinanciero({
    montoEjecutadoActual,
    estadosPago: estadosPagoData ?? [],
    transferencias: transferenciasData ?? [],
    rendiciones: rendicionesData ?? [],
    presupuestoTotal: Number(presupuestoTotal ?? data?.monto_estimado ?? 0),
  })

  const proyecto = data
    ? {
        ...data,
        presupuesto_total: presupuestoTotal,
        monto_ejecutado_actual: montoEjecutadoActual,
        avance_fisico_actual: avanceFisicoCalculado,
        avance_financiero_actual: avanceFinancieroCalculado,
        unidad: Array.isArray(data.unidad) ? data.unidad[0] ?? null : data.unidad,
        fuente: Array.isArray(data.fuente) ? data.fuente[0] ?? null : data.fuente,
        responsable: Array.isArray(data.responsable)
          ? data.responsable[0] ?? null
          : data.responsable,
      }
    : null

  if (error || !proyecto) {
    return (
      <AppShell title="Ficha del Proyecto" currentModule="cartera-proyectos">
        <div
          style={{
            background: '#fff',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 16,
            padding: 20,
          }}
        >
          No se pudo cargar la ficha del proyecto.
          {error?.message ? ` Error: ${error.message}` : ''}
        </div>
      </AppShell>
    )
  }

  const tabPermissions = {
    general: hasPermission(access, PERMISSIONS.proyectosView),
    proveedores: hasPermission(access, PERMISSIONS.proveedoresView),
    ejecucion: hasPermission(access, PERMISSIONS.ejecucionView),
    financiamiento: hasPermission(access, PERMISSIONS.financiamientoView),
    rendicion: hasPermission(access, PERMISSIONS.rendicionesView),
    garantias: hasPermission(access, PERMISSIONS.garantiasView),
    bitacora: hasPermission(access, PERMISSIONS.bitacoraView),
    historial: hasPermission(access, [PERMISSIONS.historialView, PERMISSIONS.proyectosView]),
  }
  const requestedTab = resolvedSearchParams.tab ?? 'general'
  const tab = tabPermissions[requestedTab as keyof typeof tabPermissions]
    ? requestedTab
    : Object.entries(tabPermissions).find(([, allowed]) => allowed)?.[0] ?? 'general'
  const documentosPorEstadoPago = new Map<string, typeof documentosEjecucionData>()
  const pagoProveedorPorEstadoPago = new Map<string, PagoProveedorEstadoPago>()
  const cartolasPorTransferencia = new Map<string, DocumentoEstadoPago>()
  const documentosPorRendicion = new Map<string, typeof documentosRendicionData>()
  const documentosPorGarantia = new Map<string, typeof documentosGarantiaData>()
  const documentosPorBitacora = new Map<string, typeof documentosBitacoraData>()
  const perfilesBitacoraMap = new Map(
    (perfilesBitacoraData ?? []).map((perfil) => [perfil.id, perfil])
  )

  for (const documento of documentosEjecucionData ?? []) {
    const estadoPagoId = getEstadoPagoDocumentoId(documento.observacion)
    if (!estadoPagoId) continue

    const documentos = documentosPorEstadoPago.get(estadoPagoId) ?? []
    documentos.push(documento)
    documentosPorEstadoPago.set(estadoPagoId, documentos)
  }

  for (const item of bitacoraData ?? []) {
    if (item.tipo !== 'pago_proveedor') continue

    const metadata = item.metadata as (PagoProveedorEstadoPago & {
      estado_pago_id?: string
    }) | null
    if (!metadata?.estado_pago_id) continue

    pagoProveedorPorEstadoPago.set(metadata.estado_pago_id, metadata)
  }

  for (const documento of documentosFinanciamientoData ?? []) {
    const transferenciaId = getTransferenciaDocumentoId(documento.observacion)
    if (!transferenciaId) continue

    cartolasPorTransferencia.set(transferenciaId, documento)
  }

  for (const documento of documentosRendicionData ?? []) {
    const rendicionId = getRendicionDocumentoId(documento.observacion)
    if (!rendicionId) continue

    const documentos = documentosPorRendicion.get(rendicionId) ?? []
    documentos.push(documento)
    documentosPorRendicion.set(rendicionId, documentos)
  }

  for (const documento of documentosGarantiaData ?? []) {
    const garantiaId = getGarantiaDocumentoId(documento.observacion)
    if (!garantiaId) continue

    const documentos = documentosPorGarantia.get(garantiaId) ?? []
    documentos.push(documento)
    documentosPorGarantia.set(garantiaId, documentos)
  }

  for (const documento of documentosBitacoraData ?? []) {
    const bitacoraId = getBitacoraDocumentoId(documento.observacion)
    if (!bitacoraId) continue

    const documentos = documentosPorBitacora.get(bitacoraId) ?? []
    documentos.push(documento)
    documentosPorBitacora.set(bitacoraId, documentos)
  }

  const estadosPago = (estadosPagoData ?? []).map((estadoPago) => ({
    ...estadoPago,
    documentos: documentosPorEstadoPago.get(estadoPago.id) ?? [],
    pago_proveedor: pagoProveedorPorEstadoPago.get(estadoPago.id) ?? null,
  }))

  const transferencias = (transferenciasData ?? []).map((transferencia) => ({
    ...transferencia,
    cartola: cartolasPorTransferencia.get(transferencia.id) ?? null,
  }))

  const rendiciones = (rendicionesData ?? []).map((rendicion) => ({
    ...rendicion,
    documentos: documentosPorRendicion.get(rendicion.id) ?? [],
  }))

  const garantias = (garantiasData ?? []).map((garantia) => ({
    ...garantia,
    documentos: documentosPorGarantia.get(garantia.id) ?? [],
  }))

  const bitacora = (bitacoraData ?? []).map((item) => ({
    ...item,
    usuario: item.usuario_id ? perfilesBitacoraMap.get(item.usuario_id) ?? null : null,
    documentos: documentosPorBitacora.get(item.id) ?? [],
  }))

  return (
    <AppShell title="Ficha del Proyecto" currentModule="cartera-proyectos">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ProyectoHeader proyecto={proyecto} tab={tab} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <ProyectoTabs
            proyecto={proyecto}
            tab={tab}
            descripcionProyecto={datosGenerales?.descripcion ?? null}
            visualization={
              visualization
                ? {
                    referenceUrl: `/api/project-visualizations/${proyecto.id}/reference`,
                    generatedUrls: visualization.generatedImages.map(
                      (_image, index) =>
                        `/api/project-visualizations/${proyecto.id}/generated?idx=${index}`
                    ),
                    referencePrompt: visualization.referencePrompt,
                    userInstructions: visualization.userInstructions,
                    generatedAt: visualization.generatedAt,
                  }
                : null
            }
            tabPermissions={tabPermissions}
            transferencias={transferencias}
            garantias={garantias}
            estadosPago={estadosPago}
            rendiciones={rendiciones}
            historial={historialData ?? []}
            bitacora={bitacora}
          />
          <ProjectAIAssistant
            key={`${access.userId}:${proyecto.id}`}
            projectId={proyecto.id}
            userId={access.userId}
          />
        </div>
      </div>
    </AppShell>
  )

  
}

function getEstadoPagoDocumentoId(observacion?: string | null) {
  const prefix = 'estado_pago_id:'

  if (observacion?.startsWith(prefix)) {
    return observacion.slice(prefix.length)
  }

  return ''
}

function getTransferenciaDocumentoId(observacion?: string | null) {
  const prefix = 'transferencia_id:'

  if (observacion?.startsWith(prefix)) {
    return observacion.slice(prefix.length)
  }

  return ''
}

function getRendicionDocumentoId(observacion?: string | null) {
  const prefix = 'rendicion_id:'

  if (observacion?.startsWith(prefix)) {
    return observacion.slice(prefix.length)
  }

  return ''
}

function getGarantiaDocumentoId(observacion?: string | null) {
  const prefix = 'garantia_id:'

  if (observacion?.startsWith(prefix)) {
    return observacion.slice(prefix.length)
  }

  return ''
}

function getBitacoraDocumentoId(observacion?: string | null) {
  const prefix = 'bitacora_id:'

  if (observacion?.startsWith(prefix)) {
    return observacion.slice(prefix.length)
  }

  return ''
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
  montoEjecutadoActual,
  estadosPago,
  transferencias,
  rendiciones,
  presupuestoTotal,
}: {
  montoEjecutadoActual?: number
  estadosPago: Array<{ monto?: number | string | null; estado?: string | null }>
  transferencias: Array<{ monto?: number | string | null }>
  rendiciones: Array<{ monto_rendido?: number | string | null }>
  presupuestoTotal: number
}) {
  if (!presupuestoTotal || presupuestoTotal <= 0) return 0
  const montoBase =
    typeof montoEjecutadoActual === 'number'
      ? montoEjecutadoActual
      : calcularMontoEjecutadoActual({ estadosPago, transferencias, rendiciones })

  return clampPercentage(Math.round((montoBase / presupuestoTotal) * 100))
}

function calcularMontoEjecutadoActual({
  estadosPago,
  transferencias,
  rendiciones,
}: {
  estadosPago: Array<{ monto?: number | string | null; estado?: string | null }>
  transferencias: Array<{ monto?: number | string | null }>
  rendiciones: Array<{ monto_rendido?: number | string | null }>
}) {
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

  return Math.max(totalPagado, totalTransferido, totalRendido)
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0

  return Math.max(0, Math.min(100, Math.round(value)))
}

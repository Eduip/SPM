import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import ProyectoHeader from '../../../components/ficha-proyecto/ProyectoHeader'
import ProyectoTabs from '../../../components/ficha-proyecto/ProyectoTabs'

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

 

  const proyecto = data
    ? {
        ...data,
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

  const tab = resolvedSearchParams.tab ?? 'general'

  return (
    <AppShell title="Ficha del Proyecto" currentModule="cartera-proyectos">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ProyectoHeader proyecto={proyecto} />
        <ProyectoTabs
  proyecto={proyecto}
  tab={tab}
  transferencias={transferenciasData ?? []}
  garantias={garantiasData ?? []}
  estadosPago={estadosPagoData ?? []}
  rendiciones={rendicionesData ?? []}
  historial={historialData ?? []}
  bitacora={bitacoraData ?? []}

/>
      </div>
    </AppShell>
  )

  
}
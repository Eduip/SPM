import AppShell from '../../../../../components/AppShell'
import { createClient } from '../../../../../lib/supabase-server'
import DetalleEventoPage from '../../../../../components/ficha-proyecto/historial/DetalleEventoPage'

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventoId: string }>
}) {
  const resolvedParams = await params
  const supabase = await createClient()

  const [proyectoRes, eventoRes] = await Promise.all([
    supabase
      .from('proyectos')
      .select(`
        id,
        codigo_interno,
        nombre,
        estado,
        unidad:unidades(nombre)
      `)
      .eq('id', resolvedParams.id)
      .maybeSingle(),

    supabase
      .from('historial_eventos')
      .select('*')
      .eq('id', resolvedParams.eventoId)
      .maybeSingle(),
  ])

  const proyectoData = proyectoRes.data
  const evento = eventoRes.data

  const proyecto = proyectoData
    ? {
        ...proyectoData,
        unidad: Array.isArray(proyectoData.unidad)
          ? proyectoData.unidad[0] ?? null
          : proyectoData.unidad,
      }
    : null

  if (!proyecto || !evento) {
    return (
      <AppShell title="Detalle del Evento" currentModule="cartera-proyectos">
        <div
          style={{
            background: '#fff',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 16,
            padding: 20,
          }}
        >
          No se pudo cargar el detalle del evento.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Detalle del Evento" currentModule="cartera-proyectos">
      <DetalleEventoPage proyecto={proyecto} evento={evento} />
    </AppShell>
  )
}
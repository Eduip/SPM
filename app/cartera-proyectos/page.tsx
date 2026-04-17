import AppShell from '../../components/AppShell'
import { createClient } from '../../lib/supabase-server'
import CarteraContainer from '../../components/cartera-proyectos/CarteraContainer'

export type ProyectoCartera = {
  id: string
  codigo_interno: string | null
  nombre: string
  anio_inicio: number | null
  monto_estimado: number | null
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

export default async function CarteraProyectosPage() {
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

  const proyectos: ProyectoCartera[] = ((data ?? []) as ProyectoCarteraRaw[]).map((p) => ({
    ...p,
    unidad: Array.isArray(p.unidad) ? p.unidad[0] ?? null : p.unidad,
    fuente: Array.isArray(p.fuente) ? p.fuente[0] ?? null : p.fuente,
    responsable: Array.isArray(p.responsable)
      ? p.responsable[0] ?? null
      : p.responsable,
  }))

  return (
    <AppShell title="Cartera de Proyectos" currentModule="cartera-proyectos">
      <CarteraContainer proyectos={proyectos} />
    </AppShell>
  )
}

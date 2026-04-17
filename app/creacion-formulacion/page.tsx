import AppShell from '../../components/AppShell'
import { createClient } from '../../lib/supabase-server'
import FormulationStepper from '../../components/creacion-formulacion/FormulationStepper'
import FormulationHeader from '../../components/creacion-formulacion/FormulationHeader'
import CreateProjectFormContainer from '../../components/creacion-formulacion/CreateProjectFormContainer'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function CreacionFormulacionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''

  const supabase = await createClient()

  const [
    tiposProyectoRes,
    categoriasRes,
    unidadesRes,
    fuentesRes,
    responsablesRes,
  ] = await Promise.all([
    supabase
      .from('tipos_proyecto')
      .select('id, nombre')
      .eq('activo', true)
      .order('orden', { ascending: true }),

    supabase
      .from('categorias_proyecto')
      .select('id, nombre')
      .eq('activo', true)
      .order('orden', { ascending: true }),

    supabase
      .from('unidades')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true }),

    supabase
      .from('fuentes_financiamiento')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true }),

    supabase
      .from('profiles')
      .select('id, nombre_completo, email')
      .eq('activo', true)
      .order('nombre_completo', { ascending: true }),
  ])

  const tiposProyecto = tiposProyectoRes.data ?? []
  const categorias = categoriasRes.data ?? []
  const unidades = unidadesRes.data ?? []
  const fuentes = fuentesRes.data ?? []
  const responsables = responsablesRes.data ?? []

  return (
    <AppShell
      title="Creación y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormulationHeader />
        <FormulationStepper proyectoGuardado={Boolean(proyectoId)} />

        <CreateProjectFormContainer
          proyectoId={proyectoId}
          tiposProyecto={tiposProyecto}
          categorias={categorias}
          unidades={unidades}
          fuentes={fuentes}
          responsables={responsables}
        />
      </div>
    </AppShell>
  )
}
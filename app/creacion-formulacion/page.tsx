import AppShell from '../../components/AppShell'
import { createClient } from '../../lib/supabase-server'
import FormulationStepper from '../../components/creacion-formulacion/FormulationStepper'
import FormulationHeader from '../../components/creacion-formulacion/FormulationHeader'
import CreateProjectFormContainer from '../../components/creacion-formulacion/CreateProjectFormContainer'
import ContinueProjectPanel from '../../components/creacion-formulacion/ContinueProjectPanel'

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
    proyectosEnFormulacionRes,
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

    supabase
      .from('proyectos')
      .select(
        `
        id,
        codigo_interno,
        nombre,
        etapa_formulacion_actual,
        porcentaje_formulacion,
        updated_at,
        unidad:unidades(nombre)
      `
      )
      .eq('activo', true)
      .neq('estado', 'aprobado')
      .lt('porcentaje_formulacion', 100)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const tiposProyecto = tiposProyectoRes.data ?? []
  const categorias = categoriasRes.data ?? []
  const unidades = unidadesRes.data ?? []
  const fuentes = fuentesRes.data ?? []
  const responsables = responsablesRes.data ?? []
  const proyectosEnFormulacion = (proyectosEnFormulacionRes.data ?? []).map((proyecto) => ({
    ...proyecto,
    unidad: Array.isArray(proyecto.unidad) ? proyecto.unidad[0] ?? null : proyecto.unidad,
  }))

  return (
    <AppShell
      title="Creación y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormulationHeader />
        <ContinueProjectPanel proyectos={proyectosEnFormulacion} />
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

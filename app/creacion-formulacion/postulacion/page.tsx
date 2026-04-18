import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import PostulacionFormContainer from '../../../components/creacion-formulacion/postulacion/PostulacionFormContainer'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function PostulacionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''

  const supabase = await createClient()

  const [
    fuentesRes,
    camposRes,
    reglasRes,
    respuestasRes,
    fuentesProyectoRes,
  ] = await Promise.all([
    supabase
      .from('fuentes_financiamiento')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true }),

    supabase
      .from('campos_formulario_fuente')
      .select('*')
      .eq('visible', true)
      .order('orden', { ascending: true }),

    supabase
      .from('reglas_validacion_fuente')
      .select('*'),

    proyectoId
      ? supabase
          .from('proyecto_postulacion_respuestas')
          .select('*')
          .eq('proyecto_id', proyectoId)
      : Promise.resolve({ data: [], error: null }),

    proyectoId
      ? supabase
          .from('proyecto_fuentes_financiamiento')
          .select('fuente_id')
          .eq('proyecto_id', proyectoId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const fuentes = fuentesRes.data ?? []
  const campos = camposRes.data ?? []
  const reglas = reglasRes.data ?? []
  const respuestas = respuestasRes.data ?? []
  const selectedFuenteId = fuentesProyectoRes.data?.fuente_id ?? ''

  return (
    <AppShell
      title="Registro y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PostulacionFormContainer
          proyectoId={proyectoId}
          fuentesCatalogo={fuentes}
          camposFuente={campos}
          reglasFuente={reglas}
          respuestasIniciales={respuestas}
          selectedFuenteId={selectedFuenteId}
        />
      </div>
    </AppShell>
  )
}

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
    proyectoRes,
    fuentesRes,
    camposRes,
    documentosRes,
    reglasRes,
    respuestasRes,
  ] = await Promise.all([
    supabase
      .from('proyectos')
      .select('*')
      .eq('id', proyectoId)
      .maybeSingle(),

    supabase
      .from('fuentes_financiamiento')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true }),

    supabase
      .from('campos_formulario_fuente')
      .select('*')
      .order('orden', { ascending: true }),

    supabase
      .from('documentos_fuente')
      .select('*')
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
  ])

  const proyecto = proyectoRes.data
  const fuentes = fuentesRes.data ?? []
  const campos = camposRes.data ?? []
  const documentos = documentosRes.data ?? []
  const reglas = reglasRes.data ?? []
  const respuestas = respuestasRes.data ?? []

  return (
    <AppShell
      title="Registro y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PostulacionFormContainer
          proyectoId={proyectoId}
          proyecto={proyecto}
          fuentesCatalogo={fuentes}
          camposFuente={campos}
          documentosFuente={documentos}
          reglasFuente={reglas}
          respuestasIniciales={respuestas}
        />
      </div>
    </AppShell>
  )
}
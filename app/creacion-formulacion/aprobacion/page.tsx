import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import AprobacionContainer from '../../../components/creacion-formulacion/aprobacion/AprobacionContainer'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function AprobacionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''

  const supabase = await createClient()

  const [proyectoRes, diagnosticoRes, postulacionRes, documentosRes, catalogoRes] =
    await Promise.all([
      supabase
        .from('proyectos')
        .select(`
          *,
          unidad:unidades(nombre),
          fuente:fuentes_financiamiento(nombre),
          responsable:profiles!proyectos_responsable_id_fkey(nombre_completo)
        `)
        .eq('id', proyectoId)
        .maybeSingle(),

      supabase
        .from('proyecto_diagnostico')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .maybeSingle(),

      supabase
        .from('proyecto_postulacion')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .maybeSingle(),

      supabase
        .from('documentos_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId),

      supabase
        .from('catalogo_documentos_formulacion')
        .select('id, nombre, obligatorio')
        .eq('activo', true)
        .eq('etapa', 'documentos'),
    ])

  const proyecto = proyectoRes.data
  const diagnostico = diagnosticoRes.data
  const postulacion = postulacionRes.data
  const documentos = documentosRes.data ?? []
  const catalogoDocumentos = catalogoRes.data ?? []

  return (
    <AppShell
      title="Registro y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <AprobacionContainer
        proyectoId={proyectoId}
        proyecto={proyecto}
        diagnostico={diagnostico}
        postulacion={postulacion}
        documentos={documentos}
        catalogoDocumentos={catalogoDocumentos}
      />
    </AppShell>
  )
}

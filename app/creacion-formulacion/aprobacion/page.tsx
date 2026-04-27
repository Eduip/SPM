import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import AprobacionContainer from '../../../components/creacion-formulacion/aprobacion/AprobacionContainer'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function AprobacionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''

  const supabase = await createClient()
  const access = await requirePermission(supabase, [PERMISSIONS.proyectosView, PERMISSIONS.proyectosCreate, PERMISSIONS.proyectosEdit, PERMISSIONS.proyectosApprove])

  if (!access.success) {
    return (
      <AppShell
        title="Creación y Formulación de Proyectos"
        currentModule="creacion-formulacion"
      >
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const [
    proyectoRes,
    datosGeneralesRes,
    diagnosticoRes,
    postulacionRes,
    fuenteProyectoRes,
    camposRes,
    respuestasRes,
    documentosRes,
  ] =
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
        .from('proyecto_datos_generales')
        .select('descripcion, poblacion_beneficiaria')
        .eq('proyecto_id', proyectoId)
        .maybeSingle(),

      supabase
        .from('proyecto_diagnostico')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('updated_at', { ascending: false })
        .limit(1),

      supabase
        .from('proyecto_postulacion')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .maybeSingle(),

      supabase
        .from('proyecto_fuentes_financiamiento')
        .select(
          `
          fuente_id,
          fuente:fuentes_financiamiento(nombre)
        `
        )
        .eq('proyecto_id', proyectoId)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('campos_formulario_fuente')
        .select('*')
        .eq('visible', true)
        .order('orden', { ascending: true }),

      supabase
        .from('proyecto_postulacion_respuestas')
        .select('*')
        .eq('proyecto_id', proyectoId),

      supabase
        .from('documentos_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId),
    ])

  const proyecto = proyectoRes.data
  const datosGenerales = datosGeneralesRes.data
  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data
  const postulacion = postulacionRes.data
  const fuenteId = fuenteProyectoRes.data?.fuente_id ?? ''
  const fuenteNombre = extractFuenteNombre(fuenteProyectoRes.data?.fuente)
  const camposPostulacion = (camposRes.data ?? []).filter(
    (campo) => campo.fuente_id === fuenteId
  )
  const respuestasPostulacion = respuestasRes.data ?? []
  const { data: documentosFuente } = fuenteId
    ? await supabase
        .from('documentos_fuente')
        .select('id, nombre, obligatorio')
        .eq('fuente_id', fuenteId)
        .order('orden', { ascending: true })
    : { data: [] }
  const documentos = documentosRes.data ?? []
  const catalogoDocumentos = documentosFuente ?? []

  return (
    <AppShell
      title="Creación y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <AprobacionContainer
        proyectoId={proyectoId}
        proyecto={proyecto}
        datosGenerales={datosGenerales}
        diagnostico={diagnostico}
        postulacion={postulacion}
        fuenteNombre={fuenteNombre}
        camposPostulacion={camposPostulacion}
        respuestasPostulacion={respuestasPostulacion}
        documentos={documentos}
        catalogoDocumentos={catalogoDocumentos}
      />
    </AppShell>
  )
}

function extractFuenteNombre(
  fuente: { nombre?: string | null } | { nombre?: string | null }[] | null | undefined
) {
  if (Array.isArray(fuente)) {
    return fuente[0]?.nombre ?? ''
  }

  return fuente?.nombre ?? ''
}

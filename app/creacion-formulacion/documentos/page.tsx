import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import DocumentosHeader from '../../../components/creacion-formulacion/documentos/DocumentosHeader'
import DocumentosStepper from '../../../components/creacion-formulacion/documentos/DocumentosStepper'
import DocumentosContainer from '../../../components/creacion-formulacion/documentos/DocumentosContainer'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export type CatalogoDocumento = {
  id: string
  nombre: string
  tipo: string | null
  obligatorio: boolean
  orden: number
}

export type DocumentoProyecto = {
    id: string
    proyecto_id: string
    catalogo_documento_id: string | null
    nombre: string
    nombre_archivo: string
    ruta_storage: string
    tipo_documento: string | null
    subido_por: string | null
    fecha_subida: string
    estado_revision: string | null
    porcentaje_validacion: number | null
    obligatorio: boolean
    observacion: string | null
    profile: {
        nombre_completo: string
      }[] | null
  }

export default async function DocumentosPage({ searchParams }: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''

  const supabase = await createClient()

  const { data: fuenteProyecto } = proyectoId
    ? await supabase
        .from('proyecto_fuentes_financiamiento')
        .select(
          `
          fuente_id,
          fuente:fuentes_financiamiento(nombre)
        `
        )
        .eq('proyecto_id', proyectoId)
        .limit(1)
        .maybeSingle()
    : { data: null }

  const fuenteId = fuenteProyecto?.fuente_id ?? ''
  const fuenteNombre = extractFuenteNombre(fuenteProyecto?.fuente)

  const [catalogoRes, documentosRes] = await Promise.all([
    fuenteId
      ? supabase
          .from('documentos_fuente')
          .select('id, nombre, obligatorio, orden')
          .eq('fuente_id', fuenteId)
          .order('orden', { ascending: true })
      : Promise.resolve({ data: [], error: null }),

      proyectoId
      ? supabase
          .from('documentos_proyecto')
          .select(`
            id,
            proyecto_id,
            catalogo_documento_id,
            nombre,
            nombre_archivo,
            ruta_storage,
            tipo_documento,
            subido_por,
            fecha_subida,
            estado_revision,
            porcentaje_validacion,
            obligatorio,
            observacion
          `)
          .eq('proyecto_id', proyectoId)
          .eq('etapa', 'documentos')
          .order('fecha_subida', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const catalogo = (catalogoRes.data ?? []).map((documento) => ({
    ...documento,
    tipo: 'Documento fuente',
  }))
  const documentosRaw = documentosRes.data ?? []
  const subidoPorIds = Array.from(
    new Set(documentosRaw.map((doc) => doc.subido_por).filter(Boolean))
  )
  const { data: perfiles } = subidoPorIds.length
    ? await supabase
        .from('profiles')
        .select('id, nombre_completo')
        .in('id', subidoPorIds)
    : { data: [] }
  const perfilesMap = new Map(
    (perfiles ?? []).map((perfil) => [perfil.id, perfil.nombre_completo])
  )
  const documentos = documentosRaw.map((documento) => ({
    ...documento,
    profile: documento.subido_por
      ? [{ nombre_completo: perfilesMap.get(documento.subido_por) ?? 'Usuario' }]
      : null,
  }))

  return (
    <AppShell
      title="Creación y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DocumentosHeader proyectoId={proyectoId} />
        <DocumentosStepper />
        <DocumentosContainer
          proyectoId={proyectoId}
          catalogo={catalogo}
          documentos={documentos}
          fuenteNombre={fuenteNombre}
          hasSelectedFuente={Boolean(fuenteId)}
        />
      </div>
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

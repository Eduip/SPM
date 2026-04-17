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
  tipo: string
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

  const [catalogoRes, documentosRes] = await Promise.all([
    supabase
      .from('catalogo_documentos_formulacion')
      .select('id, nombre, tipo, obligatorio, orden')
      .eq('activo', true)
      .eq('etapa', 'documentos')
      .order('orden', { ascending: true }),

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
            observacion,
            profile:profiles!documentos_proyecto_subido_por_fkey (
              nombre_completo
            )
          `)
          .eq('proyecto_id', proyectoId)
          .eq('etapa', 'documentos')
          .order('fecha_subida', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const catalogo = catalogoRes.data ?? []
  const documentos = documentosRes.data ?? []

  return (
    <AppShell
      title="Registro y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DocumentosHeader />
        <DocumentosStepper />
        <DocumentosContainer
          proyectoId={proyectoId}
          catalogo={catalogo}
          documentos={documentos}
        />
      </div>
    </AppShell>
  )
}
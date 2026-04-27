import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import DiagnosticoStepper from '../../../components/creacion-formulacion/diagnostico/DiagnosticoStepper'
import DiagnosticoFormContainer from '../../../components/creacion-formulacion/diagnostico/DiagnosticoFormContainer'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function DiagnosticoPage({ searchParams }: PageProps) {
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

  const [diagnosticoRes, documentosRes] = await Promise.all([
    proyectoId
      ? supabase
          .from('proyecto_diagnostico')
          .select(
            `
            id,
            problema_central,
            justificacion,
            causas:diagnostico_causas (
              id,
              titulo,
              descripcion
            ),
            consecuencias:diagnostico_consecuencias (
              id,
              titulo,
              descripcion
            )
          `
          )
          .eq('proyecto_id', proyectoId)
          .order('updated_at', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null, error: null }),

    proyectoId
      ? supabase
          .from('documentos_proyecto')
          .select(
            `
            id,
            nombre,
            nombre_archivo,
            tamano_bytes,
            fecha_subida,
            subido_por
          `
          )
          .eq('proyecto_id', proyectoId)
          .eq('etapa', 'diagnostico')
          .order('fecha_subida', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const diagnostico = Array.isArray(diagnosticoRes.data)
    ? diagnosticoRes.data[0] ?? null
    : diagnosticoRes.data ?? null
  const documentosRaw = documentosRes.data ?? []
  const subidoPorIds = Array.from(
    new Set(documentosRaw.map((documento) => documento.subido_por).filter(Boolean))
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
        <DiagnosticoStepper />
        <DiagnosticoFormContainer
          proyectoId={proyectoId}
          diagnostico={diagnostico}
          documentos={documentos}
        />
      </div>
    </AppShell>
  )
}

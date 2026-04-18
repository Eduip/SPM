import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import DiagnosticoStepper from '../../../components/creacion-formulacion/diagnostico/DiagnosticoStepper'
import DiagnosticoFormContainer from '../../../components/creacion-formulacion/diagnostico/DiagnosticoFormContainer'

type PageProps = {
  searchParams: Promise<{
    proyectoId?: string
  }>
}

export default async function DiagnosticoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const proyectoId = params?.proyectoId ?? ''
  const supabase = await createClient()

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
          .maybeSingle()
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
            profile:profiles!documentos_proyecto_subido_por_fkey (
              nombre_completo
            )
          `
          )
          .eq('proyecto_id', proyectoId)
          .eq('etapa', 'diagnostico')
          .order('fecha_subida', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const diagnostico = diagnosticoRes.data ?? null
  const documentos = documentosRes.data ?? []

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

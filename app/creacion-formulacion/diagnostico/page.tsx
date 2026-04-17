import AppShell from '../../../components/AppShell'
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

  return (
    <AppShell
      title="Creación y Formulación de Proyectos"
      currentModule="creacion-formulacion"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <DiagnosticoStepper />
        <DiagnosticoFormContainer proyectoId={proyectoId} />
      </div>
    </AppShell>
  )
}
import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'
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

  redirect(
    proyectoId
      ? `/creacion-formulacion/postulacion?proyectoId=${proyectoId}`
      : '/creacion-formulacion'
  )
}

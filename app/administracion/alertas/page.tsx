import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import TiposAlertaPage from '../../../components/administracion/alertas/TiposAlertaPage'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

export default async function Page() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

  if (!access.success) {
    return (
      <AppShell title="Tipos de Alertas" currentModule="administracion">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const { data: alertas, error } = await supabase
    .from('tipos_alerta')
    .select('*')
    .eq('activo', true)
    .order('modulo', { ascending: true })
    .order('nombre', { ascending: true })

  return (
    <AppShell title="Tipos de Alertas" currentModule="administracion">
      <TiposAlertaPage
        alertas={alertas ?? []}
        error={error?.message ?? null}
      />
    </AppShell>
  )
}

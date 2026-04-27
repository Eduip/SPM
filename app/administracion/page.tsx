import AppShell from '../../components/AppShell'
import AdministracionContainer from '../../components/administracion/AdministracionContainer'
import AccessDenied from '../../components/AccessDenied'
import { createClient } from '../../lib/supabase-server'
import { PERMISSIONS, requirePermission } from '../../lib/auth-guards'

export default async function AdministracionPage() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.administracionView)

  return (
    <AppShell title="Administración del Sistema" currentModule="administracion">
      {access.success ? (
        <AdministracionContainer />
      ) : (
        <AccessDenied message={access.error} />
      )}
    </AppShell>
  )
}

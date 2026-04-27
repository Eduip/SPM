import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import UnidadesPage from '../../../components/administracion/unidades/UnidadesPage'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

export default async function Page() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

  if (!access.success) {
    return (
      <AppShell title="Unidades Municipales" currentModule="administracion">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const { data: unidades, error } = await supabase
    .from('unidades')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  return (
    <AppShell title="Unidades Municipales" currentModule="administracion">
      <UnidadesPage
        unidades={unidades ?? []}
        error={error?.message ?? null}
      />
    </AppShell>
  )
}

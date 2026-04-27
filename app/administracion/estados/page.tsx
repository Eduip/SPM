import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import EstadosSistemaPage from '../../../components/administracion/estados/EstadosSistemaPage'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'

export default async function Page() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

  if (!access.success) {
    return (
      <AppShell title="Estados del Sistema" currentModule="administracion">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const { data: estados, error } = await supabase
    .from('estados_sistema')
    .select('*')
    .eq('activo', true)
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })

  return (
    <AppShell title="Estados del Sistema" currentModule="administracion">
      <EstadosSistemaPage
        estados={estados ?? []}
        error={error?.message ?? null}
      />
    </AppShell>
  )
}

import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import UnidadesPage from '../../../components/administracion/unidades/UnidadesPage'

export default async function Page() {
  const supabase = await createClient()

  const { data: unidades, error } = await supabase
    .from('unidades')
    .select('*')
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
import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import TiposAlertaPage from '../../../components/administracion/alertas/TiposAlertaPage'

export default async function Page() {
  const supabase = await createClient()

  const { data: alertas, error } = await supabase
    .from('tipos_alerta')
    .select('*')
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
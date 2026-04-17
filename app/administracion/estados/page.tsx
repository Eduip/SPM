import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import EstadosSistemaPage from '../../../components/administracion/estados/EstadosSistemaPage'

export default async function Page() {
  const supabase = await createClient()

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

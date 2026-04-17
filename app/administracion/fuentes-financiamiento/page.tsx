import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import FuentesFinanciamientoPage from '../../../components/administracion/fuentes/FuentesFinanciamientoPage'

export default async function Page() {
    const supabase = await createClient()

    const { data: fuentes, error } = await supabase
    .from('fuentes_financiamiento')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

    const { data: documentos } = await supabase
    .from('documentos_fuente')
    .select('*')
    .order('orden', { ascending: true })

    const { data: campos } = await supabase
    .from('campos_formulario_fuente')
    .select('*')
    .eq('visible', true)
    .order('orden', { ascending: true })

    const { data: reglas } = await supabase
    .from('reglas_validacion_fuente')
    .select('*')

  return (
    <AppShell title="Fuentes de Financiamiento" currentModule="administracion">
<FuentesFinanciamientoPage
  fuentes={fuentes ?? []}
  documentos={documentos ?? []}
  campos={campos ?? []}
  reglas={reglas ?? []}
  error={error?.message ?? null}
/>
    </AppShell>
  )
}

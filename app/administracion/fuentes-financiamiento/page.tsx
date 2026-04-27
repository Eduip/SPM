import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import { createClient } from '../../../lib/supabase-server'
import FuentesFinanciamientoPage from '../../../components/administracion/fuentes/FuentesFinanciamientoPage'
import { PERMISSIONS, requirePermission } from '../../../lib/auth-guards'
import { listFieldAIConfigs } from '../../../lib/ai/field-ai-config'

export default async function Page() {
    const supabase = await createClient()
    const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

    if (!access.success) {
      return (
        <AppShell title="Fuentes de Financiamiento" currentModule="administracion">
          <AccessDenied message={access.error} />
        </AppShell>
      )
    }

    const { data: fuentes, error } = await supabase
    .from('fuentes_financiamiento')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

    const { data: documentos } = await supabase
    .from('documentos_fuente')
    .select('*')
    .order('orden', { ascending: true })

    const [camposRes, fieldAIConfigs] = await Promise.all([
      supabase
        .from('campos_formulario_fuente')
        .select('*')
        .eq('visible', true)
        .order('orden', { ascending: true }),
      listFieldAIConfigs(),
    ])

    const aiModeMap = new Map(fieldAIConfigs.map((item) => [item.fieldId, item.mode]))
    const campos = (camposRes.data ?? []).map((campo) => ({
      ...campo,
      ai_mode: aiModeMap.get(campo.id),
    }))

    const { data: reglas } = await supabase
    .from('reglas_validacion_fuente')
    .select('*')

  return (
    <AppShell title="Fuentes de Financiamiento" currentModule="administracion">
<FuentesFinanciamientoPage
  fuentes={fuentes ?? []}
  documentos={documentos ?? []}
  campos={campos}
  reglas={reglas ?? []}
  error={error?.message ?? null}
/>
    </AppShell>
  )
}

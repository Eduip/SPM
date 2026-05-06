import AppShell from '../../../components/AppShell'
import AccessDenied from '../../../components/AccessDenied'
import ParametrosIAPage from '../../../components/administracion/parametros-ia/ParametrosIAPage'
import { requirePermission, PERMISSIONS } from '../../../lib/auth-guards'
import { loadMunicipalAISettings } from '../../../lib/ai/municipal-ai-settings'
import { listStrategicDocumentSummaries } from '../../../lib/ai/strategic-documents'
import { createClient } from '../../../lib/supabase-server'

export default async function ParametrosIAPageRoute() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.administracionManage)

  if (!access.success) {
    return (
      <AppShell title="Parámetros IA" currentModule="administracion">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const [settings, strategicDocuments] = await Promise.all([
    loadMunicipalAISettings(),
    listStrategicDocumentSummaries(),
  ])

  return (
    <AppShell title="Parámetros IA" currentModule="administracion">
      <ParametrosIAPage
        initialSettings={settings}
        strategicDocuments={strategicDocuments}
      />
    </AppShell>
  )
}

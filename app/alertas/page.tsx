import AppShell from '../../components/AppShell'
import AccessDenied from '../../components/AccessDenied'
import AlertasDashboard from '../../components/alertas/AlertasDashboard'
import { createClient } from '../../lib/supabase-server'
import { loadSystemAlerts } from '../../lib/system-alerts'
import { PERMISSIONS, requirePermission } from '../../lib/auth-guards'

export default async function AlertasPage() {
  const supabase = await createClient()
  const access = await requirePermission(supabase, PERMISSIONS.alertasView)

  if (!access.success) {
    return (
      <AppShell title="Gestión de Alertas" currentModule="alertas">
        <AccessDenied message={access.error} />
      </AppShell>
    )
  }

  const { alerts, error } = await loadSystemAlerts(supabase)

  return (
    <AppShell title="Gestión de Alertas" currentModule="alertas">
      {error ? <ErrorCard message={`Error al cargar datos de alertas: ${error}`} /> : null}
      <AlertasDashboard alerts={alerts} />
    </AppShell>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid #fecaca',
        color: 'var(--danger-strong)',
        borderRadius: 8,
        padding: 20,
        fontWeight: 700,
        marginBottom: 18,
      }}
    >
      {message}
    </div>
  )
}

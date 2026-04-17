import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import RolesPage from '../../../components/administracion/roles/RolesPage'

export default async function Page() {
  const supabase = await createClient()

  const [rolesRes, permisosRes, relRes] = await Promise.all([
    supabase.from('roles').select('*').eq('activo', true).order('nombre', { ascending: true }),
    supabase.from('permisos').select('*').order('modulo', { ascending: true }).order('nombre', { ascending: true }),
    supabase.from('roles_permisos').select('*'),
  ])

  return (
    <AppShell title="Roles y Permisos" currentModule="administracion">
      <RolesPage
        roles={rolesRes.data ?? []}
        permisos={permisosRes.data ?? []}
        relaciones={relRes.data ?? []}
        error={
          rolesRes.error?.message ||
          permisosRes.error?.message ||
          relRes.error?.message ||
          null
        }
      />
    </AppShell>
  )
}

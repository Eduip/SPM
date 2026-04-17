import AppShell from '../../../components/AppShell'
import { createClient } from '../../../lib/supabase-server'
import UsuariosPage from '../../../components/administracion/usuarios/UsuariosPage'

export default async function Page() {
  const supabase = await createClient()

  const [usuariosRes, rolesRes, unidadesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        *,
        rol:roles(id, nombre, codigo),
        unidad:unidades(id, nombre, codigo)
      `)
      .eq('activo', true)
      .order('nombre_completo', { ascending: true }),

    supabase
      .from('roles')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true }),

    supabase
      .from('unidades')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true }),
  ])

  return (
    <AppShell title="Creación de Usuarios" currentModule="administracion">
      <UsuariosPage
        usuarios={usuariosRes.data ?? []}
        roles={rolesRes.data ?? []}
        unidades={unidadesRes.data ?? []}
        error={
          usuariosRes.error?.message ||
          rolesRes.error?.message ||
          unidadesRes.error?.message ||
          null
        }
      />
    </AppShell>
  )
}

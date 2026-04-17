import AppShell from '../../components/AppShell'
import AdministracionContainer from '../../components/administracion/AdministracionContainer'

export default function AdministracionPage() {
  return (
    <AppShell title="Administración del Sistema" currentModule="administracion">
      <AdministracionContainer />
    </AppShell>
  )
}
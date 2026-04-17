import AppShell from '../../components/AppShell'

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" currentModule="dashboard" showTitle>
      <div
        style={{
          height: 220,
          borderRadius: 20,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        Contenido del dashboard
      </div>
    </AppShell>
  )
}

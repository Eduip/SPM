import AppShell from '../../components/AppShell'

export default function AlertasPage() {
  return (
    <AppShell title="Gestión de Alertas" currentModule="alertas" showTitle>
      <div
        style={{
          height: 220,
          borderRadius: 20,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          padding: 24,
        }}
      >
        Contenido de alertas
      </div>
    </AppShell>
  )
}

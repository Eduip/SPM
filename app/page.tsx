import Link from 'next/link'

const modules = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Cartera de proyectos', href: '/cartera-proyectos' },
  { title: 'Creación y formulación', href: '/creacion-formulacion' },
  { title: 'Alertas', href: '/alertas' },
  { title: 'Administración', href: '/administracion' },
]

export default function Home() {
  return (
    <main style={{ padding: '40px' }}>
      <h1 style={{ marginBottom: '30px' }}>
        Sistema de Gestión de Proyectos Municipales
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {modules.map((m) => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
                transition: '0.2s',
              }}
            >
              <h2>{m.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
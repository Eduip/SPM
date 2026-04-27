export default function AccessDenied({ message }: { message?: string }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid #fecaca',
        color: 'var(--danger-strong)',
        borderRadius: 8,
        padding: 22,
        fontWeight: 700,
      }}
    >
      {message || 'No tienes permisos para acceder a esta sección.'}
    </div>
  )
}

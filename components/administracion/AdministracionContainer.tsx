import AdminHeader from './AdminHeader'
import AdminCardGrid from './AdminCardGrid'

export default function AdministracionContainer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <AdminHeader />
      <AdminCardGrid />
    </div>
  )
}
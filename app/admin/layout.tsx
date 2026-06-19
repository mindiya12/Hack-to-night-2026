'use client'

import AdminSidebar from '@/components/AdminSidebar'
import AdminGuard from '@/components/AdminGuard'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <div
        style={{ display: 'flex', minHeight: '100vh', background: '#F6F9FC' }}
      >
        <AdminSidebar />
        <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      </div>
    </AdminGuard>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSession, useHydrated } from '@/lib/auth'

export default function AdminGuard({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isHydrated = useHydrated()
  const session = typeof window !== 'undefined' ? getSession() : null

  useEffect(() => {
    if (!isHydrated) return
    if (!session) {
      router.replace('/login')
    } else if (session.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [isHydrated, session, router])

  if (!isHydrated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A2540',
          color: 'white',
          fontSize: '1rem'
        }}
      >
        Verifying access…
      </div>
    )
  }

  if (!session || session.role !== 'admin') return null

  return <>{children}</>
}

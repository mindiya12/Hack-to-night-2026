'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, useHydrated } from '@/lib/auth'

export default function RouteGuard({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isHydrated = useHydrated()
  const session = typeof window !== 'undefined' ? getSession() : null

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace('/login')
    }
  }, [isHydrated, session, router])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}

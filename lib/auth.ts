export type SessionUser = {
  id: number
  username: string
  role: string
  full_name: string
  email: string
}

export function saveSession(user: SessionUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nova_session', JSON.stringify(user))
  }
}

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('nova_session') || 'null')
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nova_session')
  }
}

import { useEffect, useState } from 'react'

let hydrated = false

export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(hydrated)
  useEffect(() => {
    hydrated = true
    setIsHydrated(true)
  }, [])
  return isHydrated
}

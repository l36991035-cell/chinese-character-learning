'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        document.cookie = '__session=1; path=/'
      } else {
        document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
      setUser(u)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

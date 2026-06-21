'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [user, loading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-500">載入中…</p>
    </div>
  )
}

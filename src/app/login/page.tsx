'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle } from '@/lib/firebase/auth'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  async function handleLogin() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
      router.replace('/dashboard')
    } catch (err) {
      setError('登入失敗，請再試一次。')
      console.error(err)
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">載入中…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-10 shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">國語生字學習</h1>
        <p className="text-lg text-gray-500 mb-10">請使用 Google 帳號登入</p>

        {error && (
          <p className="mb-4 text-lg text-red-600">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1H12v3.2h5.59c-.54 2.64-2.88 4.2-5.59 4.2a6.5 6.5 0 1 1 0-13 6.4 6.4 0 0 1 4.1 1.48l2.27-2.27A10.5 10.5 0 0 0 12 1.5 10.5 10.5 0 0 0 1.5 12 10.5 10.5 0 0 0 12 22.5c5.52 0 10.17-4.04 10.17-10.5 0-.63-.06-1.27-.17-1.9z"
            />
          </svg>
          {signingIn ? '登入中…' : '使用 Google 帳號登入'}
        </button>
      </div>
    </div>
  )
}

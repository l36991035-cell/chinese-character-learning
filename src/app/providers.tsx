'use client'
import dynamic from 'next/dynamic'

// Firebase must only run in the browser; ssr:false prevents server-side init with empty API key
const AuthProvider = dynamic(
  () => import('@/hooks/AuthProvider').then((m) => ({ default: m.AuthProvider })),
  { ssr: false }
)

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

import { Suspense } from 'react'
import HomeClient from './HomeClient'

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <HomeClient />
    </Suspense>
  )
}

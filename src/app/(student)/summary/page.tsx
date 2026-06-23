import { Suspense } from 'react'
import SummaryClient from './SummaryClient'

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <SummaryClient />
    </Suspense>
  )
}

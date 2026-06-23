import { Suspense } from 'react'
import PracticeClient from './PracticeClient'

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <PracticeClient />
    </Suspense>
  )
}

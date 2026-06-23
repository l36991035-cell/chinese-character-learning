import { Suspense } from 'react'
import StudentClient from './StudentClient'

export default function StudentSettingsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <StudentClient />
    </Suspense>
  )
}

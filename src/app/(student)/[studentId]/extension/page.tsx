'use client'
export const dynamic = 'force-dynamic'

import { useParams, useRouter } from 'next/navigation'

export default function ExtensionPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-800">延伸學習</h1>
      <p className="text-xl text-gray-500">延伸學習功能即將推出。</p>
      <button
        onClick={() => router.push(`/${studentId}/home`)}
        className="min-h-[64px] flex items-center justify-center text-xl font-medium rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        回首頁
      </button>
    </div>
  )
}

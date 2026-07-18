'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function SummaryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))

  const correct = Number(searchParams.get('correct') ?? 0)
  const total = Number(searchParams.get('total') ?? 0)

  return (
    <div className="flex flex-col gap-8 text-center py-16">
      <h1 className="text-4xl font-bold text-gray-800">練習完成！</h1>

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-10">
        <p className="text-2xl text-gray-600 mb-4">答對</p>
        <p className="text-6xl font-bold text-blue-600">
          {correct} <span className="text-3xl text-gray-400">/ {total}</span>
        </p>
        <p className="text-2xl text-gray-600 mt-4">題</p>
      </div>

      {total > 0 && correct < total && (
        <p className="text-xl text-amber-700">
          {total - correct} 個字已加入錯字本，繼續加油！
        </p>
      )}

      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push(`/home?id=${studentId}`)}
          className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          回首頁
        </button>
      </div>
    </div>
  )
}

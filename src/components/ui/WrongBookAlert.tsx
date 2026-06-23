'use client'
import { useRouter } from 'next/navigation'

export function WrongBookAlert({ count, studentId }: { count: number; studentId: number }) {
  const router = useRouter()
  if (count === 0) return null

  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 flex flex-col gap-4">
      <p className="text-xl font-medium text-amber-800">
        你有 {count} 個錯字，先來練習！
      </p>
      <button
        onClick={() => router.push(`/practice?id=${studentId}&mode=wrongbook`)}
        className="min-h-[64px] flex items-center justify-center text-xl font-semibold rounded-xl bg-amber-400 text-white hover:bg-amber-500 transition-colors"
      >
        練習錯字本
      </button>
    </div>
  )
}

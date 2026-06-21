'use client'
import { useParams, useRouter } from 'next/navigation'
export default function StudentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.studentId as string | undefined
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center p-8">
      <h2 className="text-3xl font-bold text-red-600">載入失敗</h2>
      <p className="text-xl text-gray-500">{error.message || '請確認網路連線後再試'}</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          重試
        </button>
        {studentId && (
          <button
            onClick={() => router.push(`/${studentId}/home`)}
            className="min-h-[64px] text-xl font-medium rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            回首頁
          </button>
        )}
      </div>
    </div>
  )
}

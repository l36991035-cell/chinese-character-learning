'use client'
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center p-8">
      <h2 className="text-3xl font-bold text-red-600">發生錯誤</h2>
      <p className="text-xl text-gray-600">{error.message || '請稍後再試'}</p>
      <button
        onClick={reset}
        className="min-h-[64px] px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        重新載入
      </button>
    </div>
  )
}

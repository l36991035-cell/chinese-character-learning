'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getStudent } from '@/lib/db/students'
import { getPracticeHistory } from '@/lib/db/practice-history'
import { getGeneratedContent } from '@/lib/db/generated-content'
import { ExtensionPanel } from '@/components/ui/ExtensionPanel'
import type { Student, GeneratedContent } from '@/types'

type CharContent = { character: string; content: GeneratedContent }

export default function ExtensionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<(Student & { id: number }) | null>(null)
  const [charContents, setCharContents] = useState<CharContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [studentData, history] = await Promise.all([
          getStudent(studentId),
          getPracticeHistory(studentId),
        ])

        if (!studentData) return
        setStudent(studentData as Student & { id: number })

        // Get today's practice entries
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayHistory = history.filter(h => h.practicedAt >= todayStart.getTime())

        // Deduplicate characterIds from today's practice
        const seen = new Set<string>()
        const uniqueCharIds: string[] = []
        for (const h of todayHistory) {
          if (!seen.has(h.characterId)) {
            seen.add(h.characterId)
            uniqueCharIds.push(h.characterId)
          }
        }

        // Load generated content for all characters in parallel
        const results = await Promise.all(uniqueCharIds.map((id) => getGeneratedContent(id)))
        const contents: CharContent[] = results
          .filter((c): c is NonNullable<typeof c> => c !== undefined && c.status === 'ready')
          .map((c) => ({ character: c!.character, content: c! }))
        setCharContents(contents)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-2xl text-gray-500">載入中…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="min-h-[48px] px-4 text-lg text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← 返回
        </button>
        <h1 className="text-3xl font-bold text-gray-800">延伸學習</h1>
      </div>

      {charContents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-xl text-gray-500">今天還沒有練習紀錄</p>
          <p className="text-lg text-gray-400 mt-2">完成練習後再來查看延伸學習！</p>
          <button
            onClick={() => router.push(`/home?id=${studentId}`)}
            className="mt-6 min-h-[64px] px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            去練習
          </button>
        </div>
      ) : (
        <>
          {/* 進度 */}
          <div className="flex items-center justify-between">
            <p className="text-xl text-gray-500">
              第 {currentIndex + 1} / {charContents.length} 個生字
            </p>
            <div className="flex gap-1">
              {charContents.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-6 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          {/* 目前這個字的延伸內容 */}
          {student && (
            <ExtensionPanel
              key={charContents[currentIndex].content.characterId}
              character={charContents[currentIndex].character}
              bopomofo={charContents[currentIndex].content.vocabulary
                ? charContents[currentIndex].content.vocabularyBopomofo?.split(' ')[
                    charContents[currentIndex].content.vocabulary.indexOf(charContents[currentIndex].character)
                  ]
                : undefined}
              definition={charContents[currentIndex].content.definition}
              radical={charContents[currentIndex].content.radical}
              strokeCount={charContents[currentIndex].content.strokeCount}
              extensions={charContents[currentIndex].content.extensions}
              enabledExtensions={student.enabledExtensions}
            />
          )}

          {/* 上一個 / 下一個 */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
              className="min-h-[64px] flex-1 text-xl font-semibold rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← 上一個
            </button>
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              disabled={currentIndex === charContents.length - 1}
              className="min-h-[64px] flex-1 text-xl font-semibold rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              下一個 →
            </button>
          </div>
        </>
      )}

      <button
        onClick={() => router.push(`/home?id=${studentId}`)}
        className="min-h-[64px] flex items-center justify-center text-xl font-medium rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        回首頁
      </button>
    </div>
  )
}

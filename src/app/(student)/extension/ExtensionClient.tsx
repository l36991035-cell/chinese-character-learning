'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getStudentCourses } from '@/lib/db/students'
import { getCharactersByCourse } from '@/lib/db/characters'
import { getGeneratedContent } from '@/lib/db/generated-content'
import { ExtensionPanel } from '@/components/ui/ExtensionPanel'
import type { GeneratedContent } from '@/types'

type CharContent = { character: string; content: GeneratedContent }

export default function ExtensionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))

  const [loading, setLoading] = useState(true)
  const [charContents, setCharContents] = useState<CharContent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const linkedCourses = await getStudentCourses(studentId)

        const allChars: CharContent[] = []
        await Promise.all(
          linkedCourses.map(async ({ courseId }) => {
            const chars = await getCharactersByCourse(courseId)
            await Promise.all(
              chars.map(async (char) => {
                const content = await getGeneratedContent(char.id!)
                if (content && content.status === 'ready') {
                  allChars.push({ character: char.character, content })
                }
              })
            )
          })
        )

        // Sort by course order (courseId then char order)
        allChars.sort((a, b) => {
          if (a.content.courseId !== b.content.courseId) return a.content.courseId - b.content.courseId
          return a.content.characterId.localeCompare(b.content.characterId)
        })

        setCharContents(allChars)
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
          <p className="text-xl text-gray-500">目前沒有延伸學習內容</p>
          <p className="text-lg text-gray-400 mt-2">請先連結課程，並確認 AI 內容已生成。</p>
          <button
            onClick={() => router.push(`/home?id=${studentId}`)}
            className="mt-6 min-h-[64px] px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            回首頁
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xl text-gray-500">
              第 {currentIndex + 1} / {charContents.length} 個生字
            </p>
            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
              {charContents.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-4 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

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
          />

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

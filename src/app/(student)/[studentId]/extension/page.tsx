'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getTodayPractice } from '@/lib/firebase/practice-history'
import { getGeneratedContent } from '@/lib/firebase/generated-content'
import { ExtensionPanel } from '@/components/ui/ExtensionPanel'
import type { Student, GeneratedContent } from '@/types'

type CharContent = { character: string; content: GeneratedContent }

export default function ExtensionPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<(Student & { id: string }) | null>(null)
  const [charContents, setCharContents] = useState<CharContent[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [studentSnap, history] = await Promise.all([
          getDoc(doc(db, 'students', studentId)),
          getTodayPractice(studentId),
        ])

        if (!studentSnap.exists()) return
        const studentData = { id: studentSnap.id, ...studentSnap.data() } as Student & { id: string }
        setStudent(studentData)

        // Deduplicate characterIds from today's practice
        const seen = new Set<string>()
        const uniqueCharIds: string[] = []
        for (const h of history) {
          if (!seen.has(h.characterId)) {
            seen.add(h.characterId)
            uniqueCharIds.push(h.characterId)
          }
        }

        // Load generated content for each character
        const contents: CharContent[] = []
        for (const charId of uniqueCharIds) {
          const content = await getGeneratedContent(charId)
          if (content && content.status === 'ready') {
            contents.push({ character: content.character, content })
          }
        }
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
            onClick={() => router.push(`/${studentId}/home`)}
            className="mt-6 min-h-[64px] px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            去練習
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {charContents.map(({ character, content }) => (
            student && (
              <ExtensionPanel
                key={content.characterId}
                character={character}
                extensions={content.extensions}
                enabledExtensions={student.enabledExtensions}
              />
            )
          ))}
        </div>
      )}

      <button
        onClick={() => router.push(`/${studentId}/home`)}
        className="min-h-[64px] flex items-center justify-center text-xl font-medium rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        回首頁
      </button>
    </div>
  )
}

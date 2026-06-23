'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getStudent, getStudentCourses } from '@/lib/db/students'
import { getCharactersByCourse } from '@/lib/db/characters'
import { getGeneratedContent } from '@/lib/db/generated-content'
import { getWrongBook, addToWrongBook, removeFromWrongBook } from '@/lib/db/wrongbook'
import { recordPractice } from '@/lib/db/practice-history'
import { buildPracticeSession } from '@/lib/utils/session-builder'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Student, GeneratedContent, WrongBookEntry } from '@/types'
import type { Character } from '@/types'

type CourseChar = { char: Character & { id: string }; content: GeneratedContent }

export default function PracticePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))
  const mode = (searchParams.get('mode') ?? 'course') as 'wrongbook' | 'course'

  const [loading, setLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [student, setStudent] = useState<(Student & { id: number }) | null>(null)
  const [wrongBookItems, setWrongBookItems] = useState<Array<WrongBookEntry & { id: number }>>([])

  const {
    phase,
    currentItem,
    currentIndex,
    totalItems,
    results,
    sessionId,
    startSession,
    revealAnswer,
    markResult,
  } = usePracticeSession()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Load student
        const studentData = await getStudent(studentId)
        if (!studentData) return
        setStudent(studentData as Student & { id: number })

        // Load wrong book
        const wb = await getWrongBook(studentId)
        setWrongBookItems(wb as Array<WrongBookEntry & { id: number }>)

        // Load course characters + generated content
        const linkedCourses = await getStudentCourses(studentId)
        const courseChars: CourseChar[] = []

        await Promise.all(
          linkedCourses.map(async ({ courseId }) => {
            const chars = await getCharactersByCourse(courseId)
            await Promise.all(
              chars.map(async (char) => {
                const content = await getGeneratedContent(char.id!)
                if (content && content.status === 'ready') {
                  courseChars.push({ char: char as Character & { id: string }, content })
                }
              })
            )
          })
        )

        // Sort by course order
        courseChars.sort((a, b) => a.char.order - b.char.order)

        if (mode === 'wrongbook') {
          const items = buildPracticeSession(wb as Array<WrongBookEntry & { id: number }>, courseChars, studentData.grade)
          const wrongOnly = items.filter((item) => item.isFromWrongBook)
          startSession(wrongOnly.length > 0 ? wrongOnly : items)
        } else {
          const items = buildPracticeSession(wb as Array<WrongBookEntry & { id: number }>, courseChars, studentData.grade)
          startSession(items)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, mode])

  async function handleCorrect() {
    if (!currentItem || !student) return
    setSubmitError(null)
    const practiceMode = currentIndex % 2 === 0 ? 'vocabulary' : 'sentence'
    try {
      await recordPractice({
        studentId,
        characterId: currentItem.characterId,
        character: currentItem.character,
        courseId: currentItem.courseId,
        sessionId,
        practiceMode,
        isCorrect: true,
      })
      const inWrongBook = wrongBookItems.some((w) => w.characterId === currentItem.characterId)
      if (inWrongBook || currentItem.isFromWrongBook) {
        await removeFromWrongBook(studentId, currentItem.characterId)
        setWrongBookItems((prev) => prev.filter((w) => w.characterId !== currentItem.characterId))
      }
      markResult(true)
    } catch {
      setSubmitError('儲存紀錄失敗，請再試一次')
    }
  }

  async function handleWrong() {
    if (!currentItem || !student) return
    setSubmitError(null)
    const practiceMode = currentIndex % 2 === 0 ? 'vocabulary' : 'sentence'
    try {
      await recordPractice({
        studentId,
        characterId: currentItem.characterId,
        character: currentItem.character,
        courseId: currentItem.courseId,
        sessionId,
        practiceMode,
        isCorrect: false,
      })
      await addToWrongBook({
        studentId,
        characterId: currentItem.characterId,
        character: currentItem.character,
        courseId: currentItem.courseId,
        grade: currentItem.grade,
      })
      markResult(false)
    } catch {
      setSubmitError('儲存紀錄失敗，請再試一次')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Done phase
  if (phase === 'done') {
    const correct = results.filter((r) => r.isCorrect).length
    const total = results.length
    return (
      <div className="flex flex-col gap-6 text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800">本次練習完成！</h1>
        <p className="text-3xl font-semibold text-blue-600">
          答對 {correct} / {total} 題
        </p>
        {total > 0 && correct < total && (
          <p className="text-xl text-amber-700">
            錯誤字已加入錯字本，下次繼續加油！
          </p>
        )}
        <button
          onClick={() => router.push(`/home?id=${studentId}`)}
          className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          回首頁
        </button>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="flex flex-col gap-6 text-center py-12">
        <p className="text-2xl text-gray-500">沒有可練習的字</p>
        <button
          onClick={() => router.push(`/home?id=${studentId}`)}
          className="min-h-[64px] text-xl font-semibold rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          回首頁
        </button>
      </div>
    )
  }

  // Determine mode for current item: even index = vocabulary, odd index = sentence
  const isVocabMode = currentIndex % 2 === 0
  const displayText = isVocabMode ? currentItem.content.vocabulary : currentItem.content.sentence
  const displayBopomofo = isVocabMode
    ? currentItem.content.vocabularyBopomofo
    : currentItem.content.sentenceBopomofo
  const modeLabel = isVocabMode ? '詞語模式' : '短句模式'

  // Hint: show first character of the target character
  const hintChar = currentItem.character[0] ?? '_'

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xl text-gray-600">
          第 {currentIndex + 1} / {totalItems} 題
        </p>
        <span className="text-base text-gray-400">
          {currentItem.isFromWrongBook ? '📕 錯字本' : '📗 課文'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex) / totalItems) * 100}%` }}
        />
      </div>

      {/* Audio player */}
      <AudioPlayer text={currentItem.content.readingText} />

      {/* Practice card */}
      {phase === 'practicing' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col gap-6">
          <p className="text-lg text-gray-500 font-medium">{modeLabel}</p>

          <div className="text-center">
            <p className="text-4xl font-bold text-gray-800 mb-2">{displayText}</p>
            <p className="text-2xl text-blue-600">{displayBopomofo}</p>
          </div>

          <div className="border-t pt-6">
            <p className="text-lg text-gray-600 mb-3">請寫出：</p>
            <p className="text-3xl font-bold text-gray-400 tracking-widest">
              {hintChar}
              {'＿'.repeat(Math.max(0, currentItem.character.length - 1))}
            </p>
          </div>

          <button
            onClick={revealAnswer}
            className="min-h-[64px] w-full text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            公布答案
          </button>
        </div>
      )}

      {/* Reveal card */}
      {phase === 'revealing' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 flex flex-col gap-6">
          <p className="text-lg text-gray-600 font-medium">正確答案：</p>

          <div className="text-center">
            <p className="text-6xl font-bold text-gray-800 mb-3">
              {currentItem.character}
            </p>
            <p className="text-2xl text-blue-600">
              {isVocabMode
                ? currentItem.content.vocabularyBopomofo
                : currentItem.content.sentenceBopomofo}
            </p>
          </div>

          {submitError && (
            <p className="text-lg text-red-600 text-center font-medium">{submitError}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCorrect}
              className="min-h-[80px] text-2xl font-bold rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              ○ 答對
            </button>
            <button
              onClick={handleWrong}
              className="min-h-[80px] text-2xl font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              × 答錯
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

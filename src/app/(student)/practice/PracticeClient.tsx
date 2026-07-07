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
import { Skeleton } from '@/components/ui/Skeleton'
import { HandwritingCanvas } from '@/components/ui/HandwritingCanvas'
import { StrokeOrderModal } from '@/components/ui/StrokeOrderModal'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
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
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showStrokeOrder, setShowStrokeOrder] = useState(false)
  const [hasLinkedCourses, setHasLinkedCourses] = useState(false)
  const [hasErrorChars, setHasErrorChars] = useState(false)
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
        setHasLinkedCourses(linkedCourses.length > 0)
        const courseChars: CourseChar[] = []
        let errorCount = 0

        await Promise.all(
          linkedCourses.map(async ({ courseId }) => {
            const chars = await getCharactersByCourse(courseId)
            await Promise.all(
              chars.map(async (char) => {
                const content = await getGeneratedContent(char.id!)
                if (content && content.status === 'ready') {
                  courseChars.push({ char: char as Character & { id: string }, content })
                } else if (content && content.status === 'error') {
                  errorCount++
                }
              })
            )
          })
        )
        setHasErrorChars(errorCount > 0)

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
    try {
      await recordPractice({
        studentId,
        characterId: currentItem.characterId,
        character: currentItem.character,
        courseId: currentItem.courseId,
        sessionId,
        practiceMode: 'vocabulary',
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
    try {
      await recordPractice({
        studentId,
        characterId: currentItem.characterId,
        character: currentItem.character,
        courseId: currentItem.courseId,
        sessionId,
        practiceMode: 'vocabulary',
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

    if (total === 0) {
      const isAiError = hasLinkedCourses && hasErrorChars
      const isNotLinked = !hasLinkedCourses
      return (
        <div className="flex flex-col gap-6 text-center py-12">
          <h1 className="text-3xl font-bold text-ink font-serif">目前沒有可練習的生字</h1>
          {isAiError ? (
            <>
              <p className="text-xl text-[#8b7355] leading-relaxed">
                課程已連結，但生字的 AI 內容尚未完成生成。<br />請到「課程管理」點選「重新生成」。
              </p>
              <button
                onClick={() => router.push('/courses')}
                className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90"
                style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
              >
                去課程管理重新生成
              </button>
            </>
          ) : isNotLinked ? (
            <>
              <p className="text-xl text-[#8b7355] leading-relaxed">
                請到「管理設定」→「已選課程」→「+ 新增課程」，把課程連結到這位學生。
              </p>
              <button
                onClick={() => router.push(`/students/settings?id=${studentId}`)}
                className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90"
                style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
              >
                去管理設定連結課程
              </button>
            </>
          ) : (
            <p className="text-xl text-[#8b7355] leading-relaxed">
              請先匯入課程並連結到這位學生。
            </p>
          )}
          <button
            onClick={() => router.push(`/home?id=${studentId}`)}
            className="min-h-[64px] text-xl font-semibold rounded-xl border border-gold text-[#8b7355] hover:bg-card transition-colors"
          >
            回首頁
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6 text-center py-12">
        <h1 className="text-4xl font-bold text-ink font-serif">本次練習完成！</h1>
        <p className="text-3xl font-semibold text-zhu">
          答對 {correct} / {total} 題
        </p>
        {correct < total && (
          <p className="text-xl text-[#8b7355]">
            錯誤字已加入錯字本，下次繼續加油！
          </p>
        )}
        <button
          onClick={() => router.push(`/home?id=${studentId}`)}
          className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90"
          style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
        >
          回首頁
        </button>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="flex flex-col gap-6 text-center py-12">
        <p className="text-2xl text-[#8b7355]">沒有可練習的字</p>
        <button
          onClick={() => router.push(`/home?id=${studentId}`)}
          className="min-h-[64px] text-xl font-semibold rounded-xl border border-gold text-[#8b7355] hover:bg-card transition-colors"
        >
          回首頁
        </button>
      </div>
    )
  }

  const targetChar = currentItem.character
  const vocabulary = currentItem.content.vocabulary
  const bopomofoParts = (currentItem.content.vocabularyBopomofo ?? '').split(' ')
  const targetIndex = vocabulary.indexOf(targetChar)

  return (
    <div className="flex flex-col gap-6">
      {/* Exit confirmation dialog */}
      {showStrokeOrder && (
        <StrokeOrderModal
          character={targetChar}
          onClose={() => setShowStrokeOrder(false)}
        />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-card rounded-xl border border-gold p-8 flex flex-col gap-6 w-full max-w-sm" style={{ boxShadow: '0 8px 32px rgba(44,24,16,0.15)' }}>
            <h2 className="text-2xl font-bold text-ink text-center font-serif">確定要離開嗎？</h2>
            <p className="text-lg text-[#8b7355] text-center">本次練習紀錄不會儲存。</p>
            <button
              onClick={() => router.push(`/home?id=${studentId}`)}
              className="min-h-[64px] text-xl font-semibold rounded-xl bg-zhu text-[#fdf6e3] hover:brightness-90 transition-all"
            >
              離開練習
            </button>
            <button
              onClick={() => setShowExitConfirm(false)}
              className="min-h-[64px] text-xl font-semibold rounded-xl border border-gold text-[#8b7355] hover:bg-paper transition-colors"
            >
              繼續練習
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="text-lg text-[#8b7355] hover:underline"
        >
          ← 離開
        </button>
        <span className="text-base text-[#a89060]">
          {currentItem.isFromWrongBook ? '錯字本' : '課文'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xl text-[#8b7355]">
          第 {currentIndex + 1} / {totalItems} 題
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gold rounded-full h-2">
        <div
          className="bg-ink h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex) / totalItems) * 100}%` }}
        />
      </div>

      {/* Practice card */}
      {phase === 'practicing' && (
        <div className="bg-card rounded-xl border border-gold p-8 flex flex-col gap-6" style={{ boxShadow: '0 2px 12px rgba(44,24,16,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <p className="text-lg text-[#a89060] font-medium tracking-widest">詞語模式</p>

          <div className="text-center">
            <p className="text-lg text-[#8b7355] mb-4">請根據注音寫出詞語：</p>
            <div className="flex items-end justify-center gap-2">
              {Array.from(vocabulary).map((char, i) =>
                i === targetIndex ? (
                  <span key={i} className="text-5xl font-bold text-zhu leading-none font-serif">
                    {bopomofoParts[i] ?? ''}
                  </span>
                ) : (
                  <ruby key={i} className="text-5xl font-bold text-ink leading-none font-serif" style={{ rubyAlign: 'center' }}>
                    {char}
                    <rt style={{ fontSize: '0.4em', color: '#8b7355', letterSpacing: '0.05em' }}>
                      {bopomofoParts[i] ?? ''}
                    </rt>
                  </ruby>
                )
              )}
            </div>
          </div>

          <AudioPlayer key={`audio-${currentIndex}`} text={currentItem.content.vocabulary} />

          <HandwritingCanvas key={currentIndex} />

          <div className="flex gap-3">
            <button
              onClick={() => setShowStrokeOrder(true)}
              className="min-h-[64px] flex-1 text-xl font-semibold rounded-xl border border-gold text-[#8b7355] hover:bg-paper transition-colors"
            >
              看筆順
            </button>
            <button
              onClick={revealAnswer}
              className="min-h-[64px] flex-[2] text-xl font-semibold rounded-xl text-[#fdf6e3] tracking-widest transition-all hover:brightness-90"
              style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)', boxShadow: '0 4px 12px rgba(192,57,43,0.35)' }}
            >
              公布答案
            </button>
          </div>
        </div>
      )}

      {/* Reveal card */}
      {phase === 'revealing' && (
        <div className="bg-card rounded-xl border border-gold p-8 flex flex-col gap-6" style={{ boxShadow: '0 2px 12px rgba(44,24,16,0.08), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
          <p className="text-lg text-[#a89060] font-medium tracking-widest">正確答案</p>

          <div className="text-center">
            <p className="text-5xl font-bold text-ink mb-3 font-serif">
              {currentItem.content.vocabulary}
            </p>
            <p className="text-2xl text-[#8b7355]">
              {currentItem.content.vocabularyBopomofo}
            </p>
          </div>

          <AudioPlayer text={currentItem.content.vocabulary} />

          {submitError && (
            <p className="text-lg text-zhu text-center font-medium">{submitError}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCorrect}
              className="min-h-[80px] text-2xl font-bold rounded-xl text-[#f0fdf4] transition-all hover:brightness-90"
              style={{ background: 'linear-gradient(135deg, #27643a, #1e4f2e)' }}
            >
              ○ 答對
            </button>
            <button
              onClick={handleWrong}
              className="min-h-[80px] text-2xl font-bold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90"
              style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
            >
              × 答錯
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getAllCourses, updateCourseStatus, deleteCourse } from '@/lib/db/courses'
import { getCharactersByCourse } from '@/lib/db/characters'
import { getGeneratedContentByCourse, generateAndSaveCharacter } from '@/lib/db/generated-content'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Course } from '@/types'

type CourseWithId = Course & { id: number }

const SEMESTER_LABEL: Record<1 | 2, string> = { 1: '上學期', 2: '下學期' }

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [failedCounts, setFailedCounts] = useState<Record<number, number>>({})
  const [regenerating, setRegenerating] = useState<Record<number, { done: number; total: number } | null>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const loadCourses = useCallback(async () => {
    const all = await getAllCourses()
    setCourses(all)

    const counts: Record<number, number> = {}
    await Promise.all(
      all.map(async (c) => {
        const contents = await getGeneratedContentByCourse(c.id)
        counts[c.id] = contents.filter((gc) => gc.status === 'error').length
      })
    )
    setFailedCounts(counts)
  }, [])

  useEffect(() => {
    loadCourses().finally(() => setLoading(false))
  }, [loadCourses])

  async function handleDelete(courseId: number) {
    await deleteCourse(courseId)
    setConfirmDeleteId(null)
    await loadCourses()
  }

  async function handleRegenerate(course: CourseWithId) {
    const courseId = course.id
    const chars = await getCharactersByCourse(courseId)
    const contents = await getGeneratedContentByCourse(courseId)
    const failedIds = new Set(contents.filter((gc) => gc.status === 'error').map((gc) => gc.characterId))
    const failedChars = chars.filter((c) => failedIds.has(c.id!))

    if (failedChars.length === 0) return

    setRegenerating((prev) => ({ ...prev, [courseId]: { done: 0, total: failedChars.length } }))
    await updateCourseStatus(courseId, 'ai_generating')

    for (let i = 0; i < failedChars.length; i++) {
      const c = failedChars[i]
      await generateAndSaveCharacter(c.id!, courseId, c.character, course.grade)
      setRegenerating((prev) => ({ ...prev, [courseId]: { done: i + 1, total: failedChars.length } }))
      if (i < failedChars.length - 1) {
        await new Promise((r) => setTimeout(r, 6000))
      }
    }

    await updateCourseStatus(courseId, 'ready', { readyAt: Date.now() })
    setRegenerating((prev) => ({ ...prev, [courseId]: null }))
    await loadCourses()
  }

  if (loading) {
    return <p className="text-lg text-[#8b7355]">載入中…</p>
  }

  const confirmCourse = courses.find(c => c.id === confirmDeleteId)

  return (
    <div>
      {/* 刪除確認對話框 */}
      {confirmCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 w-full max-w-sm shadow-xl border border-gold">
            <h2 className="text-2xl font-bold text-ink font-serif text-center">確定要刪除？</h2>
            <p className="text-lg text-[#8b7355] text-center leading-relaxed">
              {confirmCourse.publisher}・{confirmCourse.grade} 年級・{SEMESTER_LABEL[confirmCourse.semester]}・第 {confirmCourse.lessonNumber} 課
              <br />
              <span className="font-semibold text-ink">{confirmCourse.lessonTitle}</span>
            </p>
            <p className="text-base text-red-600 text-center">刪除後無法復原，包含所有生字資料。</p>
            <button
              onClick={() => handleDelete(confirmCourse.id)}
              className="min-h-[64px] text-xl font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              確定刪除
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="min-h-[64px] text-xl font-semibold rounded-xl border-2 border-gold text-[#8b7355] hover:bg-card transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <Link href="/dashboard" className="inline-block mb-6 text-lg text-[#8b7355] hover:underline">
        ← 回到首頁
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-ink font-serif">課程管理</h1>
        <Link
          href="/courses/import"
          className="min-h-[64px] px-6 text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
        >
          <span className="text-2xl leading-none">+</span> 匯入新課程
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gold p-16 text-center">
          <p className="text-xl text-[#8b7355] mb-6">尚未匯入任何課程</p>
          <Link
            href="/courses/import"
            className="inline-flex min-h-[64px] items-center px-8 text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 gap-2"
            style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
          >
            <span className="text-2xl leading-none">+</span> 匯入第一個課程
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course) => {
            const failed = failedCounts[course.id] ?? 0
            const regen = regenerating[course.id]
            return (
              <div
                key={course.id}
                className="bg-card rounded-2xl shadow-sm border border-gold p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold text-ink">
                      {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                    </p>
                    <p className="text-lg text-[#8b7355] mt-1">{course.lessonTitle}</p>
                    {course.characterCount > 0 && (
                      <p className="text-base text-[#8b7355] mt-1">共 {course.characterCount} 個生字</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={course.status} />
                    <button
                      onClick={() => setConfirmDeleteId(course.id)}
                      disabled={!!regen}
                      className="min-h-[44px] px-4 text-base font-semibold rounded-lg border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      刪除
                    </button>
                  </div>
                </div>

                {failed > 0 && !regen && (
                  <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                    <p className="text-base text-amber-700">有 {failed} 個生字的 AI 內容未能生成</p>
                    <button
                      onClick={() => handleRegenerate(course)}
                      className="min-h-[44px] px-4 text-base font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
                    >
                      重新生成
                    </button>
                  </div>
                )}

                {regen && (
                  <div className="bg-card rounded-xl px-4 py-3 border border-gold">
                    <p className="text-base text-[#8b7355]">
                      正在生成 AI 內容… {regen.done} / {regen.total} 個
                    </p>
                    <div className="w-full bg-gold/40 rounded-full h-2 mt-2">
                      <div
                        className="bg-zhu h-2 rounded-full transition-all"
                        style={{ width: `${(regen.done / regen.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

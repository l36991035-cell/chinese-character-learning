'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStudent, updateStudent, deleteStudent, linkCourseToStudent, unlinkCourseFromStudent, getStudentCourses } from '@/lib/db/students'
import { getAllCourses, getCourse } from '@/lib/db/courses'
import { getPracticeHistory } from '@/lib/db/practice-history'
import { getWrongBook } from '@/lib/db/wrongbook'
import { WrongBookList } from '@/components/ui/WrongBookList'
import type { Student, Course, WrongBookEntry, StudentCourse } from '@/types'

type StudentWithId = Student & { id: number }
type CourseWithId = Course & { id: number }

const SEMESTER_LABEL: Record<1 | 2, string> = { 1: '上學期', 2: '下學期' }

export default function StudentSettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))

  const [student, setStudent] = useState<StudentWithId | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ learnedCount: number; accuracy: number } | null>(null)
  const [wrongBook, setWrongBook] = useState<Array<WrongBookEntry & { id: number }>>([])

  // Course linking state
  const [linkedCourses, setLinkedCourses] = useState<StudentCourse[]>([])
  const [linkedCourseDetails, setLinkedCourseDetails] = useState<Record<number, CourseWithId>>({})
  const [allReadyCourses, setAllReadyCourses] = useState<CourseWithId[]>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [linkingCourseId, setLinkingCourseId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [studentData, history, wb] = await Promise.all([
        getStudent(studentId),
        getPracticeHistory(studentId),
        getWrongBook(studentId),
      ])
      if (studentData) {
        setStudent(studentData as StudentWithId)
      }
      const learnedIds = new Set(history.filter(h => h.isCorrect).map(h => h.characterId))
      const correct = history.filter(h => h.isCorrect).length
      const accuracy = history.length > 0 ? Math.round((correct / history.length) * 100) : 0
      setStats({ learnedCount: learnedIds.size, accuracy })
      setWrongBook(wb as Array<WrongBookEntry & { id: number }>)
      setLoading(false)
    }
    fetchData()
  }, [studentId])

  useEffect(() => {
    async function fetchLinkedCourses() {
      const linked = await getStudentCourses(studentId)
      setLinkedCourses(linked)
      const details: Record<number, CourseWithId> = {}
      await Promise.all(
        linked.map(async ({ courseId }) => {
          const course = await getCourse(courseId)
          if (course) details[courseId] = course as CourseWithId
        })
      )
      setLinkedCourseDetails(details)
    }
    fetchLinkedCourses()
  }, [studentId])

  useEffect(() => {
    getAllCourses().then((courses) => {
      setAllReadyCourses(courses.filter((c) => c.status === 'ready') as CourseWithId[])
    })
  }, [])

  async function handleLinkCourse(course: CourseWithId) {
    setLinkingCourseId(course.id)
    try {
      await linkCourseToStudent(studentId, course.id, course.lessonNumber)
      setLinkedCourses((prev) => [
        ...prev,
        { studentId, courseId: course.id, linkedAt: Date.now(), selectedLessons: [course.lessonNumber] },
      ])
      setLinkedCourseDetails((prev) => ({ ...prev, [course.id]: course }))
      setShowAddCourse(false)
    } finally {
      setLinkingCourseId(null)
    }
  }

  async function handleDelete() {
    if (!confirm(`確定要刪除學生「${student?.name}」嗎？此動作無法復原。`)) return
    await deleteStudent(studentId)
    router.push('/dashboard')
  }

  async function handleUnlinkCourse(courseId: number) {
    await unlinkCourseFromStudent(studentId, courseId)
    setLinkedCourses((prev) => prev.filter((lc) => lc.courseId !== courseId))
    setLinkedCourseDetails((prev) => {
      const copy = { ...prev }
      delete copy[courseId]
      return copy
    })
  }

  const linkedCourseIds = new Set(linkedCourses.map((lc) => lc.courseId))
  const availableToAdd = allReadyCourses.filter((c) => !linkedCourseIds.has(c.id))

  if (loading) {
    return <p className="text-lg text-[#8b7355]">載入中…</p>
  }

  if (!student) {
    return <p className="text-lg text-red-600">找不到學生資料</p>
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center min-h-[48px] min-w-[48px] text-lg text-[#8b7355] hover:underline">
          ← 回到首頁
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink font-serif">{student.name}</h1>
        <p className="text-lg text-[#8b7355]">{student.grade} 年級</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-card rounded-2xl shadow-sm border border-gold p-8 mb-6">
          <h2 className="text-xl font-semibold text-ink mb-6">學習統計</h2>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-zhu">{stats.learnedCount}</p>
              <p className="text-base text-[#8b7355] mt-1">已學字數</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats.accuracy}%</p>
              <p className="text-base text-[#8b7355] mt-1">正確率</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-500">{wrongBook.length}</p>
              <p className="text-base text-[#8b7355] mt-1">錯字本</p>
            </div>
          </div>
        </div>
      )}

      {/* Wrong book list */}
      <div className="bg-card rounded-2xl shadow-sm border border-gold p-8 mb-6">
        <h2 className="text-xl font-semibold text-ink mb-6">錯字本</h2>
        <WrongBookList items={wrongBook} />
      </div>

      {/* Linked courses */}
      <div className="bg-card rounded-2xl shadow-sm border border-gold p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-ink">已選課程</h2>
          <button
            onClick={() => setShowAddCourse((v) => !v)}
            className="min-h-[64px] px-5 text-lg font-medium rounded-xl border-2 border-gold text-[#8b7355] hover:bg-[#fdf6e3] transition-colors"
          >
            + 新增課程
          </button>
        </div>

        {linkedCourses.length === 0 && !showAddCourse && (
          <p className="text-lg text-[#8b7355]">尚未連結任何課程</p>
        )}

        <div className="flex flex-col gap-3">
          {linkedCourses.map(({ courseId }) => {
            const course = linkedCourseDetails[courseId]
            return (
              <div
                key={courseId}
                className="flex items-center justify-between p-4 rounded-xl border border-gold"
              >
                <div>
                  {course ? (
                    <>
                      <p className="text-lg font-medium text-ink">
                        {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                      </p>
                      <p className="text-base text-[#8b7355]">{course.lessonTitle}</p>
                    </>
                  ) : (
                    <p className="text-lg text-[#8b7355]">載入中…</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnlinkCourse(courseId)}
                  className="min-h-[64px] px-4 text-lg text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  取消連結
                </button>
              </div>
            )
          })}
        </div>

        {/* Add course panel */}
        {showAddCourse && (
          <div className="mt-6 border-t border-gold pt-6">
            <h3 className="text-lg font-semibold text-ink mb-4">選擇課程</h3>
            {availableToAdd.length === 0 ? (
              <p className="text-lg text-[#8b7355]">
                沒有可新增的課程。請先{' '}
                <Link href="/courses/import" className="text-[#c0392b] hover:underline">
                  匯入課程
                </Link>
                。
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {availableToAdd.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleLinkCourse(course)}
                    disabled={linkingCourseId === course.id}
                    className="w-full text-left p-4 rounded-xl border-2 border-gold hover:border-[#c0392b] transition-colors disabled:opacity-50"
                  >
                    <p className="text-lg font-medium text-ink">
                      {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                    </p>
                    <p className="text-base text-[#8b7355]">{course.lessonTitle}・{course.characterCount} 個生字</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete student */}
      <div className="mt-8 pt-6 border-t border-gold">
        <button
          onClick={handleDelete}
          className="min-h-[64px] w-full text-xl font-semibold rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors"
        >
          刪除這位學生
        </button>
      </div>
    </div>
  )
}

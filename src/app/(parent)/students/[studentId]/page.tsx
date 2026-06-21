'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { updateStudent, linkCourseToStudent, unlinkCourseFromStudent, getStudentCourses } from '@/lib/firebase/students'
import { getCoursesByImporter, getCourse } from '@/lib/firebase/courses'
import { getStudentStats } from '@/lib/firebase/practice-history'
import { getWrongBook } from '@/lib/firebase/wrongbook'
import { useAuth } from '@/hooks/useAuth'
import { WrongBookList } from '@/components/ui/WrongBookList'
import type { Student, Course, WrongBookEntry } from '@/types'

type StudentWithId = Student & { id: string }
type CourseWithId = Course & { id: string }
interface LinkedCourse { courseId: string; selectedLessons: number[] }

interface ExtensionMeta {
  key: keyof Student['enabledExtensions']
  label: string
  minGrade: number
}

const EXTENSIONS: ExtensionMeta[] = [
  { key: 'confusableChars', label: '易混淆字', minGrade: 1 },
  { key: 'wordFormation', label: '造詞', minGrade: 1 },
  { key: 'semanticRelation', label: '找朋友', minGrade: 1 },
  { key: 'multiPronunciation', label: '多音字', minGrade: 3 },
  { key: 'synonyms', label: '同義詞', minGrade: 3 },
  { key: 'antonyms', label: '反義詞', minGrade: 3 },
  { key: 'idioms', label: '成語', minGrade: 5 },
  { key: 'rhetoric', label: '修辭', minGrade: 5 },
]

const SEMESTER_LABEL: Record<1 | 2, string> = { 1: '上學期', 2: '下學期' }

export default function StudentSettingsPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const { user } = useAuth()

  const [student, setStudent] = useState<StudentWithId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<{ learnedCount: number; accuracy: number } | null>(null)
  const [wrongBook, setWrongBook] = useState<Array<WrongBookEntry & { id: string }>>([])


  // Course linking state
  const [linkedCourses, setLinkedCourses] = useState<LinkedCourse[]>([])
  const [linkedCourseDetails, setLinkedCourseDetails] = useState<Record<string, CourseWithId>>({})
  const [allReadyCourses, setAllReadyCourses] = useState<CourseWithId[]>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [linkingCourseId, setLinkingCourseId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudent() {
      const [snap, statsData, wb] = await Promise.all([
        getDoc(doc(db, 'students', studentId)),
        getStudentStats(studentId),
        getWrongBook(studentId),
      ])
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() } as StudentWithId)
      }
      setStats(statsData)
      setWrongBook(wb)
      setLoading(false)
    }
    fetchStudent()
  }, [studentId])

  useEffect(() => {
    async function fetchLinkedCourses() {
      const linked = await getStudentCourses(studentId)
      setLinkedCourses(linked)
      // Fetch course details for each linked course
      const details: Record<string, CourseWithId> = {}
      await Promise.all(
        linked.map(async ({ courseId }) => {
          const course = await getCourse(courseId)
          if (course) details[courseId] = { id: courseId, ...course }
        })
      )
      setLinkedCourseDetails(details)
    }
    fetchLinkedCourses()
  }, [studentId])

  useEffect(() => {
    if (!user) return
    getCoursesByImporter(user.uid).then((courses) => {
      setAllReadyCourses(courses.filter((c) => c.status === 'ready'))
    })
  }, [user])

  async function handleToggle(key: keyof Student['enabledExtensions']) {
    if (!student) return
    const updated: Student['enabledExtensions'] = {
      ...student.enabledExtensions,
      [key]: !student.enabledExtensions[key],
    }
    setStudent({ ...student, enabledExtensions: updated })
    setSaving(true)
    try {
      await updateStudent(studentId, { enabledExtensions: updated })
    } finally {
      setSaving(false)
    }
  }

  async function handleLinkCourse(course: CourseWithId) {
    setLinkingCourseId(course.id)
    try {
      await linkCourseToStudent(studentId, course.id, course.lessonNumber)
      setLinkedCourses((prev) => [
        ...prev,
        { courseId: course.id, selectedLessons: [course.lessonNumber] },
      ])
      setLinkedCourseDetails((prev) => ({ ...prev, [course.id]: course }))
      setShowAddCourse(false)
    } finally {
      setLinkingCourseId(null)
    }
  }

  async function handleUnlinkCourse(courseId: string) {
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
    return <p className="text-lg text-gray-500">載入中…</p>
  }

  if (!student) {
    return <p className="text-lg text-red-600">找不到學生資料</p>
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center min-h-[48px] min-w-[48px] text-lg text-blue-600 hover:underline">
          ← 回到首頁
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
        <p className="text-lg text-gray-500">{student.grade} 年級</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">學習統計</h2>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{stats.learnedCount}</p>
              <p className="text-base text-gray-500 mt-1">已學字數</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats.accuracy}%</p>
              <p className="text-base text-gray-500 mt-1">正確率</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-500">{wrongBook.length}</p>
              <p className="text-base text-gray-500 mt-1">錯字本</p>
            </div>
          </div>
        </div>
      )}

      {/* Wrong book list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">錯字本</h2>
        <WrongBookList items={wrongBook} />
      </div>

      {/* Extension toggles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">延伸學習設定</h2>
          {saving && <span className="text-base text-gray-400">儲存中…</span>}
        </div>

        <div className="flex flex-col gap-4">
          {EXTENSIONS.map(({ key, label, minGrade }) => {
            const available = student.grade >= minGrade
            return (
              <label
                key={key}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  available
                    ? 'border-gray-200 hover:border-blue-300'
                    : 'border-gray-100 opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded accent-blue-600"
                  checked={student.enabledExtensions[key]}
                  disabled={!available}
                  onChange={() => available && handleToggle(key)}
                />
                <span className="text-lg text-gray-800">{label}</span>
                {!available && (
                  <span className="ml-auto text-base text-gray-400">{minGrade} 年級以上</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Linked courses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">已選課程</h2>
          <button
            onClick={() => setShowAddCourse((v) => !v)}
            className="min-h-[64px] px-5 text-lg font-medium rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            + 新增課程
          </button>
        </div>

        {linkedCourses.length === 0 && !showAddCourse && (
          <p className="text-lg text-gray-400">尚未連結任何課程</p>
        )}

        <div className="flex flex-col gap-3">
          {linkedCourses.map(({ courseId }) => {
            const course = linkedCourseDetails[courseId]
            return (
              <div
                key={courseId}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200"
              >
                <div>
                  {course ? (
                    <>
                      <p className="text-lg font-medium text-gray-800">
                        {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                      </p>
                      <p className="text-base text-gray-500">{course.lessonTitle}</p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-400">載入中…</p>
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
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">選擇課程</h3>
            {availableToAdd.length === 0 ? (
              <p className="text-lg text-gray-400">
                沒有可新增的課程。請先{' '}
                <Link href="/courses/import" className="text-blue-600 hover:underline">
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
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-colors disabled:opacity-50"
                  >
                    <p className="text-lg font-medium text-gray-800">
                      {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                    </p>
                    <p className="text-base text-gray-500">{course.lessonTitle}・{course.characterCount} 個生字</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

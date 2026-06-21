'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getCoursesByImporter } from '@/lib/firebase/courses'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Course } from '@/types'

type CourseWithId = Course & { id: string }

const SEMESTER_LABEL: Record<1 | 2, string> = { 1: '上學期', 2: '下學期' }

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<CourseWithId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getCoursesByImporter(user.uid)
      .then(setCourses)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return <p className="text-lg text-gray-500">載入中…</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">課程管理</h1>
        <Link
          href="/courses/import"
          className="min-h-[64px] px-6 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-2xl leading-none">+</span> 匯入新課程
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
          <p className="text-xl text-gray-500 mb-6">尚未匯入任何課程</p>
          <Link
            href="/courses/import"
            className="inline-flex min-h-[64px] items-center px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors gap-2"
          >
            <span className="text-2xl leading-none">+</span> 匯入第一個課程
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {course.publisher}・{course.grade} 年級・{SEMESTER_LABEL[course.semester]}・第 {course.lessonNumber} 課
                </p>
                <p className="text-lg text-gray-600 mt-1">{course.lessonTitle}</p>
                {course.characterCount > 0 && (
                  <p className="text-base text-gray-400 mt-1">共 {course.characterCount} 個生字</p>
                )}
              </div>
              <StatusBadge status={course.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

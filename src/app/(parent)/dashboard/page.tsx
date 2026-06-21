'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getStudentsByParent } from '@/lib/firebase/students'
import { getStudentStats } from '@/lib/firebase/practice-history'
import { getWrongBook } from '@/lib/firebase/wrongbook'
import { StudentCardSkeleton } from '@/components/ui/Skeleton'
import type { Student } from '@/types'

type StudentWithId = Student & { id: string }

export default function DashboardPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentWithId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getStudentsByParent(user.uid)
      .then(setStudents)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 w-32 animate-pulse bg-gray-200 rounded-xl" />
          <div className="flex gap-3">
            <div className="h-16 w-36 animate-pulse bg-gray-200 rounded-xl" />
            <div className="h-16 w-32 animate-pulse bg-gray-200 rounded-xl" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <StudentCardSkeleton />
          <StudentCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">我的學生</h1>
        <div className="flex gap-3">
          <Link
            href="/courses/import"
            className="min-h-[64px] px-6 text-lg font-medium rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors flex items-center"
          >
            匯入新課程
          </Link>
          <Link
            href="/students/new"
            className="min-h-[64px] px-6 text-lg font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-2xl leading-none">+</span> 新增學生
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
          <p className="text-xl text-gray-500 mb-6">尚未新增學生</p>
          <Link
            href="/students/new"
            className="inline-flex min-h-[64px] items-center px-8 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors gap-2"
          >
            <span className="text-2xl leading-none">+</span> 新增第一位學生
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentCard({ student }: { student: StudentWithId }) {
  const [learnedCount, setLearnedCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)

  useEffect(() => {
    Promise.all([
      getStudentStats(student.id),
      getWrongBook(student.id),
    ]).then(([stats, wb]) => {
      setLearnedCount(stats.learnedCount)
      setWrongCount(wb.length)
    })
  }, [student.id])

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
        <p className="text-lg text-gray-500">{student.grade} 年級</p>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{learnedCount}</p>
          <p className="text-base text-gray-500">已學字數</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-500">{wrongCount}</p>
          <p className="text-base text-gray-500">錯字本數量</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/${student.id}/home`}
          className="flex-1 min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          開始練習
        </Link>
        <Link
          href={`/students/${student.id}`}
          className="min-h-[64px] px-5 text-lg font-medium rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          管理設定
        </Link>
      </div>
    </div>
  )
}

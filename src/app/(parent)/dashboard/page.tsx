'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAllStudents } from '@/lib/db/students'
import { getPracticeHistory } from '@/lib/db/practice-history'
import { getWrongBook } from '@/lib/db/wrongbook'
import { StudentCardSkeleton } from '@/components/ui/Skeleton'
import type { Student } from '@/types'

type StudentWithId = Student & { id: number }

export default function DashboardPage() {
  const [students, setStudents] = useState<StudentWithId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 w-32 animate-pulse bg-gold/30 rounded-xl" />
          <div className="flex gap-3">
            <div className="h-16 w-36 animate-pulse bg-gold/30 rounded-xl" />
            <div className="h-16 w-32 animate-pulse bg-gold/30 rounded-xl" />
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
        <h1 className="text-3xl font-bold text-ink font-serif">我的學生</h1>
        <div className="flex gap-3">
          <Link
            href="/courses"
            className="min-h-[64px] px-6 text-lg font-medium rounded-xl border-2 border-gold text-[#8b7355] hover:bg-card transition-colors flex items-center"
          >
            課程管理
          </Link>
          <Link
            href="/students/new"
            className="min-h-[64px] px-6 text-lg font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
          >
            <span className="text-2xl leading-none">+</span> 新增學生
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gold p-16 text-center">
          <p className="text-xl text-[#8b7355] mb-6">尚未新增學生</p>
          <Link
            href="/students/new"
            className="inline-flex min-h-[64px] items-center px-8 text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 gap-2"
            style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
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
      getPracticeHistory(student.id),
      getWrongBook(student.id),
    ]).then(([history, wb]) => {
      const learnedIds = new Set(history.filter(h => h.isCorrect).map(h => h.characterId))
      setLearnedCount(learnedIds.size)
      setWrongCount(wb.length)
    })
  }, [student.id])

  return (
    <div className="rounded-2xl bg-card shadow-sm border border-gold p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-ink">{student.name}</h2>
        <p className="text-lg text-[#8b7355]">{student.grade} 年級</p>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-zhu">{learnedCount}</p>
          <p className="text-base text-[#8b7355]">已學字數</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-orange-500">{wrongCount}</p>
          <p className="text-base text-[#8b7355]">錯字本數量</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/home?id=${student.id}`}
          className="flex-1 min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
        >
          開始練習
        </Link>
        <Link
          href={`/students/settings?id=${student.id}`}
          className="min-h-[64px] px-5 text-lg font-medium rounded-xl border-2 border-gold text-[#8b7355] hover:bg-card transition-colors flex items-center justify-center"
        >
          管理設定
        </Link>
      </div>
    </div>
  )
}

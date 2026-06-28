'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStudent, getStudentCourses } from '@/lib/db/students'
import { useWrongBook } from '@/hooks/useWrongBook'
import { WrongBookAlert } from '@/components/ui/WrongBookAlert'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Student } from '@/types'

export default function StudentHomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = Number(searchParams.get('id'))

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<(Student & { id: number }) | null>(null)
  const [hasCourses, setHasCourses] = useState(false)

  const { items: wrongBook } = useWrongBook(studentId)

  useEffect(() => {
    async function load() {
      try {
        const [studentData, linkedCourses] = await Promise.all([
          getStudent(studentId),
          getStudentCourses(studentId),
        ])
        if (studentData) {
          setStudent(studentData as Student & { id: number })
        }
        setHasCourses(linkedCourses.length > 0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-6">
          <Skeleton className="h-10 w-32 mx-auto mb-3" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl text-red-600">找不到學生資料</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back to dashboard */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center min-h-[48px] text-lg text-[#8b7355] hover:underline">
          ← 回首頁
        </Link>
      </div>

      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-ink font-serif">{student.name}</h1>
        <p className="text-xl text-[#8b7355] mt-2">{student.grade} 年級</p>
      </div>

      {/* Wrong book alert */}
      <WrongBookAlert count={wrongBook.length} studentId={studentId} />

      {/* Course practice */}
      {hasCourses ? (
        <button
          onClick={() => router.push(`/practice?id=${studentId}&mode=course`)}
          className="min-h-[64px] flex items-center justify-center text-xl font-semibold rounded-xl text-[#fdf6e3] tracking-widest transition-all hover:brightness-90"
          style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)', boxShadow: '0 4px 12px rgba(192,57,43,0.3)' }}
        >
          開始課文練習
        </button>
      ) : (
        <div className="bg-card rounded-xl border border-gold p-6 text-center">
          <p className="text-lg text-[#8b7355]">尚未連結任何課程，請先請家長設定課程。</p>
        </div>
      )}

      {/* Extension learning */}
      <Link
        href={`/extension?id=${studentId}`}
        className="min-h-[64px] flex items-center justify-center text-xl font-medium rounded-xl border border-gold text-[#8b7355] hover:bg-card transition-colors"
      >
        查看延伸學習
      </Link>
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getStudentCourses } from '@/lib/firebase/students'
import { useWrongBook } from '@/hooks/useWrongBook'
import { WrongBookAlert } from '@/components/ui/WrongBookAlert'
import type { Student } from '@/types'

export default function StudentHomePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<(Student & { id: string }) | null>(null)
  const [hasCourses, setHasCourses] = useState(false)

  const { items: wrongBook } = useWrongBook(studentId)

  useEffect(() => {
    async function load() {
      try {
        const [snap, linkedCourses] = await Promise.all([
          getDoc(doc(db, 'students', studentId)),
          getStudentCourses(studentId),
        ])
        if (snap.exists()) {
          setStudent({ id: snap.id, ...snap.data() } as Student & { id: string })
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-2xl text-gray-500">載入中…</p>
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
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-gray-800">{student.name}</h1>
        <p className="text-xl text-gray-500 mt-2">{student.grade} 年級</p>
      </div>

      {/* Wrong book alert */}
      <WrongBookAlert count={wrongBook.length} studentId={studentId} />

      {/* Course practice */}
      {hasCourses ? (
        <button
          onClick={() => router.push(`/${studentId}/practice?mode=course`)}
          className="min-h-[64px] flex items-center justify-center text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          開始課文練習
        </button>
      ) : (
        <div className="bg-gray-100 rounded-2xl p-6 text-center">
          <p className="text-lg text-gray-500">尚未連結任何課程，請先請家長設定課程。</p>
        </div>
      )}

      {/* Extension learning */}
      <Link
        href={`/${studentId}/extension`}
        className="min-h-[64px] flex items-center justify-center text-xl font-medium rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
      >
        查看延伸學習
      </Link>
    </div>
  )
}

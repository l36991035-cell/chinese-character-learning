'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createStudent } from '@/lib/db/students'
import type { Student } from '@/types'

const GRADE_OPTIONS: { value: Student['grade']; label: string }[] = [
  { value: 1, label: '1 年級' },
  { value: 2, label: '2 年級' },
  { value: 3, label: '3 年級' },
  { value: 4, label: '4 年級' },
  { value: 5, label: '5 年級' },
  { value: 6, label: '6 年級' },
]

export default function NewStudentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<Student['grade']>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('請輸入學生姓名')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await createStudent(name.trim(), grade)
      router.replace('/dashboard')
    } catch (err) {
      setError('新增失敗，請再試一次。')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center min-h-[48px] min-w-[48px] text-lg text-[#8b7355] hover:underline"
        >
          ← 回到首頁
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-ink font-serif mb-8">新增學生</h1>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm border border-gold p-8 flex flex-col gap-6">
        <div>
          <label htmlFor="name" className="block text-lg font-medium text-ink mb-2">
            姓名
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="請輸入學生姓名"
            className="w-full min-h-[56px] rounded-xl border-2 border-gold px-4 text-lg text-ink focus:border-[#c0392b] focus:outline-none bg-card"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-lg font-medium text-ink mb-2">
            年級
          </label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value) as Student['grade'])}
            className="w-full min-h-[56px] rounded-xl border-2 border-gold px-4 text-lg text-ink focus:border-[#c0392b] focus:outline-none bg-card"
          >
            {GRADE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-lg text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
        >
          {submitting ? '新增中…' : '建立學生'}
        </button>
      </form>
    </div>
  )
}

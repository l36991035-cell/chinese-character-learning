'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { updateStudent } from '@/lib/firebase/students'
import type { Student } from '@/types'

type StudentWithId = Student & { id: string }

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

export default function StudentSettingsPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const [student, setStudent] = useState<StudentWithId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchStudent() {
      const snap = await getDoc(doc(db, 'students', studentId))
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() } as StudentWithId)
      }
      setLoading(false)
    }
    fetchStudent()
  }, [studentId])

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

  if (loading) {
    return <p className="text-lg text-gray-500">載入中…</p>
  }

  if (!student) {
    return <p className="text-lg text-red-600">找不到學生資料</p>
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-lg text-blue-600 hover:underline">
          ← 回到首頁
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{student.name}</h1>
        <p className="text-lg text-gray-500">{student.grade} 年級</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
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
    </div>
  )
}

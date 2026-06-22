'use client'
export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { useAuth } from '@/hooks/useAuth'
import { createCourse, getCourse } from '@/lib/firebase/courses'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Publisher, Course, CourseStatus } from '@/types'
import Link from 'next/link'

type Step = 'form' | 'upload' | 'processing' | 'done'
type UploadMode = 'file' | 'manual'

const PUBLISHERS: Publisher[] = ['康軒', '南一', '翰林']
const GRADES = [1, 2, 3, 4, 5, 6] as const
const TERMINAL_STATUSES: CourseStatus[] = ['ready', 'error']

interface FormState {
  publisher: Publisher
  grade: Course['grade']
  semester: 1 | 2
  lessonNumber: number
  lessonTitle: string
}

export default function ImportPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('form')
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [form, setForm] = useState<FormState>({
    publisher: '康軒',
    grade: 1,
    semester: 1,
    lessonNumber: 1,
    lessonTitle: '',
  })
  const [courseId, setCourseId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [manualText, setManualText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null)
  const [characterCount, setCharacterCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const previewChars = [...new Set((manualText.match(/[一-鿿]/g) ?? []))]

  // Polling for course status
  useEffect(() => {
    if (step !== 'processing' || !courseId) return

    pollRef.current = setInterval(async () => {
      const course = await getCourse(courseId)
      if (!course) return
      setCourseStatus(course.status)
      setCharacterCount(course.characterCount)
      if (TERMINAL_STATUSES.includes(course.status)) {
        clearInterval(pollRef.current!)
        setStep('done')
      }
    }, 3000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [step, courseId])

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const lessonTitle = form.lessonTitle.trim() || `第${form.lessonNumber}課`
    const id = await createCourse({
      importedBy: user.uid,
      publisher: form.publisher,
      grade: form.grade,
      semester: form.semester,
      lessonNumber: form.lessonNumber,
      lessonTitle,
    })
    setCourseId(id)
    setStep('upload')
  }

  function handleFileSelect(file: File) {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.doc')) {
      setUploadError('請上傳 Word（.doc / .docx）或 Excel（.xlsx）文件')
      return
    }
    setSelectedFile(file)
    setUploadError(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  async function handleUpload() {
    if (!selectedFile || !courseId) return
    setUploading(true)
    setUploadError(null)

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setUploadError('請先登入')
        setUploading(false)
        return
      }
      const idToken = await getIdToken(currentUser)

      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('courseId', courseId)

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: fd,
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) {
        setUploadError(json.error ?? '上傳失敗，請再試一次')
        setUploading(false)
        return
      }
      setCourseStatus('parsing')
      setStep('processing')
    } catch (err) {
      setUploadError('上傳失敗：' + String(err))
      setUploading(false)
    }
  }

  async function handleManualSubmit() {
    if (!courseId || previewChars.length === 0) return
    setUploading(true)
    setUploadError(null)

    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setUploadError('請先登入')
        setUploading(false)
        return
      }
      const idToken = await getIdToken(currentUser)

      const res = await fetch('/api/manual', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId, text: manualText }),
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) {
        setUploadError(json.error ?? '送出失敗，請再試一次')
        setUploading(false)
        return
      }
      setCourseStatus('parsing')
      setStep('processing')
    } catch (err) {
      setUploadError('送出失敗：' + String(err))
      setUploading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center min-h-[48px] min-w-[48px] text-lg text-blue-600 hover:underline">
          ← 回到首頁
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">匯入新課程</h1>

      {/* Step 1: Course info form */}
      {step === 'form' && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-6">
          {/* Publisher */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">出版社</label>
            <div className="flex gap-3">
              {PUBLISHERS.map((pub) => (
                <button
                  key={pub}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, publisher: pub }))}
                  className={`min-h-[64px] flex-1 text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.publisher === pub
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {pub}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">年級</label>
            <div className="grid grid-cols-3 gap-3">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, grade: g }))}
                  className={`min-h-[64px] text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.grade === g
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {g} 年級
                </button>
              ))}
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">學期</label>
            <div className="flex gap-3">
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, semester: s }))}
                  className={`min-h-[64px] flex-1 text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.semester === s
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {s === 1 ? '上學期' : '下學期'}
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Number */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">課次</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.lessonNumber}
              onChange={(e) => setForm((f) => ({ ...f, lessonNumber: parseInt(e.target.value) || 1 }))}
              className="w-full min-h-[64px] px-4 text-xl rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-xl font-semibold text-gray-700 mb-3">
              課文名稱 <span className="text-base font-normal text-gray-400">（選填）</span>
            </label>
            <input
              type="text"
              placeholder={`第${form.lessonNumber}課`}
              value={form.lessonTitle}
              onChange={(e) => setForm((f) => ({ ...f, lessonTitle: e.target.value }))}
              className="w-full min-h-[64px] px-4 text-xl rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            下一步：輸入生字
          </button>
        </form>
      )}

      {/* Step 2: Upload or Manual input */}
      {step === 'upload' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">輸入生字</h2>
            <p className="text-lg text-gray-500">
              {form.publisher}・{form.grade} 年級・{form.semester === 1 ? '上學期' : '下學期'}・第 {form.lessonNumber} 課
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
            <button
              onClick={() => { setUploadMode('manual'); setUploadError(null) }}
              className={`flex-1 min-h-[56px] text-lg font-medium transition-colors ${
                uploadMode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              手動輸入
            </button>
            <button
              onClick={() => { setUploadMode('file'); setUploadError(null) }}
              className={`flex-1 min-h-[56px] text-lg font-medium transition-colors ${
                uploadMode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              上傳文件
            </button>
          </div>

          {/* Manual input */}
          {uploadMode === 'manual' && (
            <>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  貼上或輸入課文內容，系統自動抓取生字
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="例如：小時不識月，呼作白玉盤。又疑瑤台鏡，飛在青雲端。"
                  rows={6}
                  className="w-full px-4 py-3 text-xl rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {previewChars.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-base text-blue-700 font-medium mb-2">找到 {previewChars.length} 個不重複漢字：</p>
                  <p className="text-2xl tracking-widest text-blue-900">{previewChars.join(' ')}</p>
                </div>
              )}

              {uploadError && <p className="text-lg text-red-600">{uploadError}</p>}

              <button
                onClick={handleManualSubmit}
                disabled={previewChars.length === 0 || uploading}
                className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '送出中…' : `確認送出 ${previewChars.length > 0 ? previewChars.length + ' 個生字' : ''}`}
              </button>
            </>
          )}

          {/* File upload */}
          {uploadMode === 'file' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx,.xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                {selectedFile ? (
                  <div>
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-xl font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-base text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-2">📂</p>
                    <p className="text-xl text-gray-500">拖曳 Word（.docx）或 Excel（.xlsx）至此，或點擊選擇檔案</p>
                  </div>
                )}
              </div>

              {uploadError && <p className="text-lg text-red-600">{uploadError}</p>}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="min-h-[64px] text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上傳中…' : '開始上傳解析'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Processing */}
      {(step === 'processing' || step === 'done') && courseId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-gray-800">解析進度</h2>

          <div className="flex items-center gap-4">
            <span className="text-lg text-gray-600">目前狀態：</span>
            {courseStatus && <StatusBadge status={courseStatus} />}
          </div>

          {courseStatus === 'ai_generating' && characterCount > 0 && (
            <p className="text-lg text-gray-600">AI 生成中… 共 {characterCount} 個生字</p>
          )}

          {step === 'processing' && (
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-lg text-gray-500 ml-2">每 3 秒自動更新</span>
            </div>
          )}

          {step === 'done' && courseStatus === 'ready' && (
            <div>
              <p className="text-xl text-green-700 font-semibold">完成！共 {characterCount} 個生字，AI 已生成延伸資料。</p>
              <div className="flex gap-4 mt-6">
                <Link
                  href="/courses"
                  className="min-h-[64px] flex-1 text-xl font-semibold rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  查看所有課程
                </Link>
                <Link
                  href="/courses/import"
                  onClick={() => { setStep('form'); setCourseId(null); setSelectedFile(null); setCourseStatus(null); setManualText('') }}
                  className="min-h-[64px] flex-1 text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  再匯入一堂課
                </Link>
              </div>
            </div>
          )}

          {step === 'done' && courseStatus === 'error' && (
            <p className="text-xl text-red-600 font-semibold">解析失敗，請重新嘗試。</p>
          )}

          <p className="text-base text-gray-400">課程 ID：{courseId}</p>
        </div>
      )}
    </div>
  )
}

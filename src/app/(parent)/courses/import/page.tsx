'use client'

import { useCallback, useRef, useState } from 'react'
import { createCourse, updateCourseStatus } from '@/lib/db/courses'
import { saveCharacters } from '@/lib/db/characters'
import { generateAndSaveCharacter } from '@/lib/db/generated-content'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Publisher, Course, CourseStatus } from '@/types'
import Link from 'next/link'

type Step = 'form' | 'upload' | 'processing' | 'done'
type UploadMode = 'file' | 'manual'

const PUBLISHERS: Publisher[] = ['康軒', '南一', '翰林']
const GRADES = [1, 2, 3, 4, 5, 6] as const

interface FormState {
  publisher: Publisher
  grade: Course['grade']
  semester: 1 | 2
  lessonNumber: number
  lessonTitle: string
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('form')
  const [uploadMode, setUploadMode] = useState<UploadMode>('manual')
  const [form, setForm] = useState<FormState>({
    publisher: '康軒',
    grade: 1,
    semester: 1,
    lessonNumber: 1,
    lessonTitle: '',
  })
  const [courseId, setCourseId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [manualText, setManualText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null)
  const [characterCount, setCharacterCount] = useState<number>(0)
  const [generatedCount, setGeneratedCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewChars = [...new Set((manualText.match(/[一-鿿]/g) ?? []))]

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const lessonTitle = form.lessonTitle.trim() || `第${form.lessonNumber}課`
    const id = await createCourse({
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
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.xlsx')) {
      setUploadError('請上傳 Word（.docx）或 Excel（.xlsx）文件')
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

  async function runAiGeneration(charIds: string[], parsedChars: Array<{ character: string }>, cId: number) {
    for (let i = 0; i < parsedChars.length; i++) {
      await generateAndSaveCharacter(charIds[i], cId, parsedChars[i].character, form.grade)
      setGeneratedCount(i + 1)
      if (i < parsedChars.length - 1) {
        await new Promise(r => setTimeout(r, 6000))
      }
    }
    await updateCourseStatus(cId, 'ready', { readyAt: Date.now() })
    setCourseStatus('ready')
    setStep('done')
  }

  async function handleUpload() {
    if (!selectedFile || !courseId) return
    setUploading(true)
    setUploadError(null)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      let uniqueChars: string[] = []

      if (selectedFile.name.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer })
        uniqueChars = [...new Set((result.value.match(/[一-鿿]/g) ?? []))]
      } else if (selectedFile.name.endsWith('.xlsx')) {
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        let allText = ''
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          allText += XLSX.utils.sheet_to_csv(sheet)
        }
        uniqueChars = [...new Set((allText.match(/[一-鿿]/g) ?? []))]
      }

      if (uniqueChars.length === 0) {
        setUploadError('未能從文件中讀取到漢字，請確認文件內容')
        setUploading(false)
        return
      }

      const parsedChars = uniqueChars.map(c => ({ character: c }))
      const charIds = await saveCharacters(courseId, parsedChars)
      await updateCourseStatus(courseId, 'ai_generating', { characterCount: uniqueChars.length })

      setCourseStatus('ai_generating')
      setCharacterCount(uniqueChars.length)
      setGeneratedCount(0)
      setStep('processing')

      await runAiGeneration(charIds, parsedChars, courseId)
    } catch (err) {
      setUploadError('解析失敗：' + String(err))
      if (courseId) await updateCourseStatus(courseId, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleManualSubmit() {
    if (!courseId || previewChars.length === 0) return
    setUploading(true)
    setUploadError(null)

    try {
      const parsedChars = previewChars.map(c => ({ character: c }))
      const charIds = await saveCharacters(courseId, parsedChars)
      await updateCourseStatus(courseId, 'ai_generating', { characterCount: previewChars.length })

      setCourseStatus('ai_generating')
      setCharacterCount(previewChars.length)
      setGeneratedCount(0)
      setStep('processing')

      await runAiGeneration(charIds, parsedChars, courseId)
    } catch (err) {
      setUploadError('送出失敗：' + String(err))
      if (courseId) await updateCourseStatus(courseId, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center min-h-[48px] min-w-[48px] text-lg text-[#8b7355] hover:underline">
          ← 回到首頁
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-ink font-serif mb-8">匯入新課程</h1>

      {/* Step 1: Course info form */}
      {step === 'form' && (
        <form onSubmit={handleFormSubmit} className="bg-card rounded-2xl shadow-sm border border-gold p-8 flex flex-col gap-6">
          {/* Publisher */}
          <div>
            <label className="block text-xl font-semibold text-ink mb-3">出版社</label>
            <div className="flex gap-3">
              {PUBLISHERS.map((pub) => (
                <button
                  key={pub}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, publisher: pub }))}
                  className={`min-h-[64px] flex-1 text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.publisher === pub
                      ? 'border-[#c0392b] bg-[#fdf6e3] text-[#c0392b]'
                      : 'border-gold text-[#8b7355] hover:border-[#c0392b]'
                  }`}
                >
                  {pub}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xl font-semibold text-ink mb-3">年級</label>
            <div className="grid grid-cols-3 gap-3">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, grade: g }))}
                  className={`min-h-[64px] text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.grade === g
                      ? 'border-[#c0392b] bg-[#fdf6e3] text-[#c0392b]'
                      : 'border-gold text-[#8b7355] hover:border-[#c0392b]'
                  }`}
                >
                  {g} 年級
                </button>
              ))}
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xl font-semibold text-ink mb-3">學期</label>
            <div className="flex gap-3">
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, semester: s }))}
                  className={`min-h-[64px] flex-1 text-xl rounded-xl border-2 font-medium transition-colors ${
                    form.semester === s
                      ? 'border-[#c0392b] bg-[#fdf6e3] text-[#c0392b]'
                      : 'border-gold text-[#8b7355] hover:border-[#c0392b]'
                  }`}
                >
                  {s === 1 ? '上學期' : '下學期'}
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Number */}
          <div>
            <label className="block text-xl font-semibold text-ink mb-3">課次</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.lessonNumber}
              onChange={(e) => setForm((f) => ({ ...f, lessonNumber: parseInt(e.target.value) || 1 }))}
              className="w-full min-h-[64px] px-4 text-xl rounded-xl border-2 border-gold focus:border-[#c0392b] focus:outline-none bg-card text-ink"
            />
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-xl font-semibold text-ink mb-3">
              課文名稱 <span className="text-base font-normal text-[#8b7355]">（選填）</span>
            </label>
            <input
              type="text"
              placeholder={`第${form.lessonNumber}課`}
              value={form.lessonTitle}
              onChange={(e) => setForm((f) => ({ ...f, lessonTitle: e.target.value }))}
              className="w-full min-h-[64px] px-4 text-xl rounded-xl border-2 border-gold focus:border-[#c0392b] focus:outline-none bg-card text-ink"
            />
          </div>

          <button
            type="submit"
            className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90"
            style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
          >
            下一步：輸入生字
          </button>
        </form>
      )}

      {/* Step 2: Upload or Manual input */}
      {step === 'upload' && (
        <div className="bg-card rounded-2xl shadow-sm border border-gold p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold text-ink font-serif mb-1">輸入生字</h2>
            <p className="text-lg text-[#8b7355]">
              {form.publisher}・{form.grade} 年級・{form.semester === 1 ? '上學期' : '下學期'}・第 {form.lessonNumber} 課
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border-2 border-gold overflow-hidden">
            <button
              onClick={() => { setUploadMode('manual'); setUploadError(null) }}
              className={`flex-1 min-h-[56px] text-lg font-medium transition-colors ${
                uploadMode === 'manual'
                  ? 'text-[#fdf6e3]'
                  : 'text-[#8b7355] hover:bg-[#fdf6e3]'
              }`}
              style={uploadMode === 'manual' ? { background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' } : {}}
            >
              手動輸入
            </button>
            <button
              onClick={() => { setUploadMode('file'); setUploadError(null) }}
              className={`flex-1 min-h-[56px] text-lg font-medium transition-colors ${
                uploadMode === 'file'
                  ? 'text-[#fdf6e3]'
                  : 'text-[#8b7355] hover:bg-[#fdf6e3]'
              }`}
              style={uploadMode === 'file' ? { background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' } : {}}
            >
              上傳文件
            </button>
          </div>

          {/* Manual input */}
          {uploadMode === 'manual' && (
            <>
              <div>
                <label className="block text-lg font-medium text-ink mb-2">
                  貼上或輸入課文內容，系統自動抓取生字
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="例如：小時不識月，呼作白玉盤。又疑瑤台鏡，飛在青雲端。"
                  rows={6}
                  className="w-full px-4 py-3 text-xl rounded-xl border-2 border-gold focus:border-[#c0392b] focus:outline-none resize-none bg-[#fffdf5] text-ink"
                />
              </div>

              {previewChars.length > 0 && (
                <div className="bg-[#fdf6e3] rounded-xl p-4 border border-gold">
                  <p className="text-base text-[#8b7355] font-medium mb-2">找到 {previewChars.length} 個不重複漢字：</p>
                  <p className="text-2xl tracking-widest text-ink">{previewChars.join(' ')}</p>
                </div>
              )}

              {uploadError && <p className="text-lg text-red-600">{uploadError}</p>}

              <button
                onClick={handleManualSubmit}
                disabled={previewChars.length === 0 || uploading}
                className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
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
                  dragging ? 'border-[#c0392b] bg-[#fdf6e3]' : 'border-gold hover:border-[#c0392b] hover:bg-[#fdf6e3]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                {selectedFile ? (
                  <div>
                    <p className="text-2xl mb-2">📄</p>
                    <p className="text-xl font-medium text-ink">{selectedFile.name}</p>
                    <p className="text-base text-[#8b7355] mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-2">📂</p>
                    <p className="text-xl text-[#8b7355]">拖曳 Word（.docx）或 Excel（.xlsx）至此，或點擊選擇檔案</p>
                  </div>
                )}
              </div>

              {uploadError && <p className="text-lg text-red-600">{uploadError}</p>}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
              >
                {uploading ? '解析中…' : '開始解析'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Processing */}
      {(step === 'processing' || step === 'done') && courseId && (
        <div className="bg-card rounded-2xl shadow-sm border border-gold p-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-ink font-serif">解析進度</h2>

          <div className="flex items-center gap-4">
            <span className="text-lg text-[#8b7355]">目前狀態：</span>
            {courseStatus && <StatusBadge status={courseStatus} />}
          </div>

          {step === 'processing' && (
            <div>
              <p className="text-lg text-[#8b7355]">AI 生成中… {generatedCount} / {characterCount} 個生字</p>
              <div className="flex gap-2 items-center mt-3">
                <div className="w-2 h-2 rounded-full bg-zhu animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-zhu animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-zhu animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {step === 'done' && courseStatus === 'ready' && (
            <div>
              <p className="text-xl text-green-700 font-semibold">完成！共 {characterCount} 個生字，AI 已生成延伸資料。</p>
              <p className="text-lg text-[#8b7355] mt-3">下一步：到學生的「管理設定」→「已選課程」→「+ 新增課程」，把這堂課連結給學生。</p>
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="min-h-[64px] text-xl font-semibold rounded-xl text-[#fdf6e3] transition-all hover:brightness-90 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c0392b, #8b1a1a)' }}
                >
                  回首頁（去連結學生）
                </Link>
                <Link
                  href="/courses/import"
                  onClick={() => { setStep('form'); setCourseId(null); setSelectedFile(null); setCourseStatus(null); setManualText('') }}
                  className="min-h-[64px] text-xl font-semibold rounded-xl border-2 border-gold text-[#8b7355] hover:bg-[#fdf6e3] transition-colors flex items-center justify-center"
                >
                  再匯入一堂課
                </Link>
              </div>
            </div>
          )}

          {step === 'done' && courseStatus === 'error' && (
            <p className="text-xl text-red-600 font-semibold">解析失敗，請重新嘗試。</p>
          )}

          <p className="text-base text-[#8b7355]">課程 ID：{courseId}</p>
        </div>
      )}
    </div>
  )
}

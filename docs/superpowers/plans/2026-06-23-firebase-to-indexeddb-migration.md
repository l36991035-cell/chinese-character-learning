# Firebase → IndexedDB Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將國語生字 App 從 Firebase+Vercel 架構，改為 IndexedDB+GitHub Pages+Cloudflare Worker 全免費架構，與英文 App 一致。

**Architecture:** 前端（Next.js 靜態輸出）直接讀寫平板的 IndexedDB；Cloudflare Worker 保管 Gemini API Key 並代理 AI 呼叫；GitHub Pages 部署靜態檔案，不需要後端伺服器。

**Tech Stack:** Next.js 15（`output: 'export'`）、Dexie.js（IndexedDB）、Cloudflare Worker（Gemini proxy）、GitHub Actions（自動部署）

## Global Constraints

- 所有 UI 文字維持繁體中文
- 不移除任何現有功能（只換底層儲存和 AI 呼叫方式）
- 不需要登入，直接進入 Dashboard
- mammoth.js 改用 `arrayBuffer` API（瀏覽器相容版）
- 動態路由 `[studentId]` 全部改為 query param `?id=xxx`
- `basePath` 預設 `/chinese-character-learning`（若 GitHub repo 名稱不同請修改 next.config.ts）
- 每完成一個 Task 必須 git commit

---

## File Map

### 刪除的檔案
- `src/lib/firebase/` （整個目錄）
- `src/app/api/` （整個目錄）
- `src/app/login/page.tsx`
- `src/hooks/AuthProvider.tsx`
- `src/hooks/useAuth.ts`
- `src/middleware.ts`

### 新增的檔案
- `src/lib/db/index.ts` — Dexie 資料庫定義（schema）
- `src/lib/db/students.ts` — 學生 CRUD
- `src/lib/db/courses.ts` — 課程 CRUD
- `src/lib/db/characters.ts` — 生字 CRUD
- `src/lib/db/generated-content.ts` — AI 生成內容 CRUD
- `src/lib/db/wrongbook.ts` — 錯字本 CRUD
- `src/lib/db/practice-history.ts` — 練習記錄 CRUD
- `worker/index.js` — Cloudflare Worker（Gemini proxy）
- `worker/wrangler.toml` — Worker 部署設定
- `.github/workflows/deploy.yml` — GitHub Actions 自動部署

### 修改的檔案
- `package.json` — 移除 firebase、firebase-admin、next-pwa；加入 dexie、dexie-react-hooks
- `next.config.ts` — 加入 `output: 'export'`、`trailingSlash: true`、`basePath`
- `src/types/index.ts` — 移除 Firebase Timestamp，改用 `number`（Unix ms）
- `src/app/layout.tsx` — 移除 Firebase providers
- `src/app/page.tsx` — 直接 redirect 到 `/dashboard`
- `src/app/(parent)/layout.tsx` — 移除 auth guard
- `src/app/(student)/layout.tsx` — 移除 auth guard
- `src/app/(parent)/dashboard/page.tsx` — 用 Dexie 取代 Firebase
- `src/app/(parent)/students/new/page.tsx` — 用 Dexie 取代 Firebase
- `src/app/(parent)/students/[studentId]/page.tsx` → **重命名** 為 `src/app/(parent)/students/settings/page.tsx`
- `src/app/(parent)/courses/page.tsx` — 用 Dexie 取代 Firebase
- `src/app/(parent)/courses/import/page.tsx` — 完全重寫（移除 API 呼叫，改瀏覽器端解析+Worker）
- `src/app/(student)/[studentId]/home/page.tsx` → **重命名** 為 `src/app/(student)/home/page.tsx`
- `src/app/(student)/[studentId]/practice/page.tsx` → **重命名** 為 `src/app/(student)/practice/page.tsx`
- `src/app/(student)/[studentId]/summary/page.tsx` → **重命名** 為 `src/app/(student)/summary/page.tsx`
- `src/app/(student)/[studentId]/extension/page.tsx` → **重命名** 為 `src/app/(student)/extension/page.tsx`
- `src/hooks/usePracticeSession.ts` — 用 Dexie 取代 Firebase
- `src/hooks/useWrongBook.ts` — 用 Dexie 取代 Firebase
- `src/lib/docx/parser.ts` — 改用 `arrayBuffer` API

---

## Task 1: 依賴套件與建置設定

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 安裝新依賴、移除舊依賴**

```bash
cd C:\Users\user\Desktop\chinese-character-learning
npm uninstall firebase firebase-admin next-pwa word-extractor
npm install dexie dexie-react-hooks
```

- [ ] **Step 2: 更新 next.config.ts**

將整個 `next.config.ts` 改為：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/chinese-character-learning',
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 3: 建立 GitHub Actions 部署 workflow**

建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 4: 驗證 build 設定（目前會失敗，這是正常的——確認錯誤是 Firebase 相關，不是 webpack 設定問題）**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts .github/
git commit -m "建置設定：改為靜態輸出，加入 GitHub Pages 部署，移除 Firebase 套件"
```

---

## Task 2: 型別系統更新

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 將 `src/types/index.ts` 完整替換**

移除 Firebase Timestamp，改用 `number`（Unix milliseconds），移除 `parentId`/`importedBy`：

```typescript
// ─── Practice Mode ───────────────────────────────────────────────────────────

export type PracticeMode = 'vocabulary' | 'sentence' | 'wrongbook' | 'extension'

// ─── Publisher / Course Status ────────────────────────────────────────────────

export type Publisher = '康軒' | '南一' | '翰林'
export type CourseStatus = 'uploading' | 'parsing' | 'ai_generating' | 'ready' | 'error'

// ─── Student ─────────────────────────────────────────────────────────────────

export interface Student {
  id?: number
  name: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  createdAt: number  // Unix ms
  enabledExtensions: {
    confusableChars: boolean
    wordFormation: boolean
    semanticRelation: boolean
    multiPronunciation: boolean
    synonyms: boolean
    antonyms: boolean
    idioms: boolean
    rhetoric: boolean
  }
}

// ─── StudentCourse ────────────────────────────────────────────────────────────

export interface StudentCourse {
  id?: number
  studentId: number
  courseId: number
  linkedAt: number  // Unix ms
  selectedLessons: number[]
}

// ─── WrongBookEntry ───────────────────────────────────────────────────────────

export interface WrongBookEntry {
  id?: number
  studentId: number
  characterId: string
  character: string
  courseId: number
  grade: number
  addedAt: number         // Unix ms
  wrongCount: number
  lastPracticedAt: number | null  // Unix ms
}

// ─── PracticeHistory ─────────────────────────────────────────────────────────

export interface PracticeHistory {
  id?: number
  studentId: number
  characterId: string
  character: string
  courseId: number
  sessionId: string
  practiceMode: PracticeMode
  isCorrect: boolean
  practicedAt: number  // Unix ms
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id?: number
  publisher: Publisher
  grade: 1 | 2 | 3 | 4 | 5 | 6
  semester: 1 | 2
  lessonNumber: number
  lessonTitle: string
  characterCount: number
  status: CourseStatus
  errorMessage?: string
  importedAt: number   // Unix ms
  readyAt?: number     // Unix ms
}

// ─── Character ────────────────────────────────────────────────────────────────

export interface Character {
  id?: string            // courseId_001 format
  courseId: number
  character: string
  strokeCount: number | null
  radical: string | null
  order: number
}

// ─── Extensions ───────────────────────────────────────────────────────────────

export interface Extensions {
  confusableChars: Array<{ char: string; explanation: string }>
  wordFormation: string[]
  semanticRelation: string[]
  multiPronunciation: Array<{ pronunciation: string; meaning: string; example: string }>
  synonyms: string[]
  antonyms: string[]
  idioms: Array<{ idiom: string; meaning: string }>
  rhetoric: Array<{ type: string; example: string }>
}

// ─── GeneratedContent ────────────────────────────────────────────────────────

export interface GeneratedContent {
  id?: string            // same as characterId
  characterId: string
  courseId: number
  grade: number
  character: string
  vocabulary: string
  vocabularyBopomofo: string
  sentence: string
  sentenceBopomofo: string
  readingText: string
  extensions: Extensions
  status: 'pending' | 'ready' | 'error'
  errorMessage?: string
  generatedAt?: number   // Unix ms
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "型別系統：移除 Firebase Timestamp，改用 Unix ms；移除 parentId/importedBy"
```

---

## Task 3: Dexie 資料庫層

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/students.ts`
- Create: `src/lib/db/courses.ts`
- Create: `src/lib/db/characters.ts`
- Create: `src/lib/db/generated-content.ts`
- Create: `src/lib/db/wrongbook.ts`
- Create: `src/lib/db/practice-history.ts`

- [ ] **Step 1: 建立 `src/lib/db/index.ts`**

```typescript
import Dexie, { type Table } from 'dexie'
import type {
  Student, Course, Character, GeneratedContent,
  WrongBookEntry, PracticeHistory, StudentCourse,
} from '@/types'

export class AppDatabase extends Dexie {
  students!: Table<Student, number>
  courses!: Table<Course, number>
  studentCourses!: Table<StudentCourse, number>
  characters!: Table<Character, string>
  generatedContent!: Table<GeneratedContent, string>
  wrongBook!: Table<WrongBookEntry, number>
  practiceHistory!: Table<PracticeHistory, number>

  constructor() {
    super('ChineseCharacterLearning')
    this.version(1).stores({
      students:        '++id, createdAt',
      courses:         '++id, status, importedAt',
      studentCourses:  '++id, studentId, courseId, [studentId+courseId]',
      characters:      'id, courseId, order',
      generatedContent: 'id, courseId, status',
      wrongBook:       '++id, studentId, characterId, [studentId+characterId]',
      practiceHistory: '++id, studentId, courseId, practicedAt',
    })
  }
}

export const db = new AppDatabase()
```

- [ ] **Step 2: 建立 `src/lib/db/students.ts`**

```typescript
import { db } from './index'
import { getDefaultExtensions } from '@/lib/utils/grade-extensions'
import type { Student, StudentCourse } from '@/types'

export async function createStudent(name: string, grade: Student['grade']): Promise<number> {
  return db.students.add({
    name,
    grade,
    createdAt: Date.now(),
    enabledExtensions: getDefaultExtensions(grade),
  })
}

export async function getAllStudents(): Promise<Array<Student & { id: number }>> {
  return db.students.orderBy('createdAt').toArray() as Promise<Array<Student & { id: number }>>
}

export async function getStudent(id: number): Promise<(Student & { id: number }) | undefined> {
  return db.students.get(id) as Promise<(Student & { id: number }) | undefined>
}

export async function updateStudent(id: number, data: Partial<Omit<Student, 'id' | 'createdAt'>>): Promise<void> {
  await db.students.update(id, data)
}

export async function deleteStudent(id: number): Promise<void> {
  await db.transaction('rw', db.students, db.studentCourses, db.wrongBook, db.practiceHistory, async () => {
    await db.students.delete(id)
    await db.studentCourses.where('studentId').equals(id).delete()
    await db.wrongBook.where('studentId').equals(id).delete()
    await db.practiceHistory.where('studentId').equals(id).delete()
  })
}

export async function linkCourseToStudent(studentId: number, courseId: number, lessonNumber: number): Promise<void> {
  const existing = await db.studentCourses
    .where('[studentId+courseId]').equals([studentId, courseId]).first()
  if (existing) {
    await db.studentCourses.update(existing.id!, {
      selectedLessons: [...new Set([...(existing.selectedLessons ?? []), lessonNumber])],
    })
  } else {
    await db.studentCourses.add({ studentId, courseId, linkedAt: Date.now(), selectedLessons: [lessonNumber] })
  }
}

export async function unlinkCourseFromStudent(studentId: number, courseId: number): Promise<void> {
  await db.studentCourses.where('[studentId+courseId]').equals([studentId, courseId]).delete()
}

export async function getStudentCourses(studentId: number): Promise<StudentCourse[]> {
  return db.studentCourses.where('studentId').equals(studentId).toArray()
}
```

- [ ] **Step 3: 建立 `src/lib/db/courses.ts`**

```typescript
import { db } from './index'
import type { Course, CourseStatus } from '@/types'

export async function createCourse(data: Omit<Course, 'id' | 'characterCount' | 'status' | 'importedAt'>): Promise<number> {
  return db.courses.add({
    ...data,
    characterCount: 0,
    status: 'uploading',
    importedAt: Date.now(),
  })
}

export async function getCourse(id: number): Promise<(Course & { id: number }) | undefined> {
  return db.courses.get(id) as Promise<(Course & { id: number }) | undefined>
}

export async function getAllCourses(): Promise<Array<Course & { id: number }>> {
  return db.courses.orderBy('importedAt').reverse().toArray() as Promise<Array<Course & { id: number }>>
}

export async function updateCourseStatus(id: number, status: CourseStatus, extra?: Partial<Course>): Promise<void> {
  await db.courses.update(id, { status, ...extra })
}

export async function deleteCourse(id: number): Promise<void> {
  await db.transaction('rw', db.courses, db.characters, db.generatedContent, db.studentCourses, async () => {
    await db.courses.delete(id)
    const charIds = (await db.characters.where('courseId').equals(id).toArray()).map(c => c.id!)
    await db.characters.where('courseId').equals(id).delete()
    await db.generatedContent.bulkDelete(charIds)
    await db.studentCourses.where('courseId').equals(id).delete()
  })
}
```

- [ ] **Step 4: 建立 `src/lib/db/characters.ts`**

```typescript
import { db } from './index'
import type { Character } from '@/types'

export async function saveCharacters(courseId: number, chars: Array<{ character: string }>): Promise<string[]> {
  const records: Array<Character & { id: string }> = chars.map((c, i) => ({
    id: `${courseId}_${String(i + 1).padStart(3, '0')}`,
    courseId,
    character: c.character,
    strokeCount: null,
    radical: null,
    order: i + 1,
  }))
  await db.characters.bulkPut(records)
  return records.map(r => r.id)
}

export async function getCharactersByCourse(courseId: number): Promise<Array<Character & { id: string }>> {
  return db.characters.where('courseId').equals(courseId).sortBy('order') as Promise<Array<Character & { id: string }>>
}
```

- [ ] **Step 5: 建立 `src/lib/db/generated-content.ts`**

```typescript
import { db } from './index'
import type { GeneratedContent } from '@/types'

export async function saveGeneratedContent(content: Omit<GeneratedContent, 'id'>): Promise<void> {
  await db.generatedContent.put({ ...content, id: content.characterId })
}

export async function getGeneratedContent(characterId: string): Promise<GeneratedContent | undefined> {
  return db.generatedContent.get(characterId)
}

export async function getGeneratedContentByCourse(courseId: number): Promise<GeneratedContent[]> {
  return db.generatedContent.where('courseId').equals(courseId).toArray()
}
```

- [ ] **Step 6: 建立 `src/lib/db/wrongbook.ts`**

```typescript
import { db } from './index'
import type { WrongBookEntry } from '@/types'

export async function addToWrongBook(entry: Omit<WrongBookEntry, 'id' | 'addedAt' | 'wrongCount' | 'lastPracticedAt'>): Promise<void> {
  const existing = await db.wrongBook
    .where('[studentId+characterId]').equals([entry.studentId, entry.characterId]).first()
  if (existing) {
    await db.wrongBook.update(existing.id!, { wrongCount: existing.wrongCount + 1, lastPracticedAt: Date.now() })
  } else {
    await db.wrongBook.add({ ...entry, addedAt: Date.now(), wrongCount: 1, lastPracticedAt: null })
  }
}

export async function getWrongBook(studentId: number): Promise<WrongBookEntry[]> {
  return db.wrongBook.where('studentId').equals(studentId).toArray()
}

export async function removeFromWrongBook(studentId: number, characterId: string): Promise<void> {
  await db.wrongBook.where('[studentId+characterId]').equals([studentId, characterId]).delete()
}
```

- [ ] **Step 7: 建立 `src/lib/db/practice-history.ts`**

```typescript
import { db } from './index'
import type { PracticeHistory } from '@/types'

export async function recordPractice(entry: Omit<PracticeHistory, 'id' | 'practicedAt'>): Promise<void> {
  await db.practiceHistory.add({ ...entry, practicedAt: Date.now() })
}

export async function getPracticeHistory(studentId: number): Promise<PracticeHistory[]> {
  return db.practiceHistory.where('studentId').equals(studentId).sortBy('practicedAt')
}
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/db/ src/types/index.ts
git commit -m "新增 Dexie 資料庫層：7 個資料表，取代 Firebase Firestore"
```

---

## Task 4: 移除 Auth 與登入

**Files:**
- Delete: `src/app/login/page.tsx`
- Delete: `src/hooks/AuthProvider.tsx`
- Delete: `src/hooks/useAuth.ts`
- Delete: `src/middleware.ts`
- Delete: `src/lib/firebase/` (整個目錄)
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/(parent)/layout.tsx`
- Modify: `src/app/(student)/layout.tsx`
- Modify: `src/app/providers.tsx`

- [ ] **Step 1: 刪除 Firebase 與 Auth 相關檔案**

```bash
rm -rf src/lib/firebase
rm -f src/app/login/page.tsx
rm -f src/hooks/AuthProvider.tsx
rm -f src/hooks/useAuth.ts
rm -f src/middleware.ts
```

- [ ] **Step 2: 更新 `src/app/page.tsx`（直接跳轉 dashboard）**

```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-500">載入中…</p>
    </div>
  )
}
```

- [ ] **Step 3: 更新 `src/app/layout.tsx`**

讀取目前的 `src/app/layout.tsx`，移除所有 Firebase、AuthProvider 相關的 import 和 wrapper。保留 HTML 結構、字型、Tailwind 設定。確認沒有 `<AuthProvider>` 或 `<Providers>` 包含 Firebase 初始化。

- [ ] **Step 4: 更新 `src/app/providers.tsx`**

讀取目前的 `src/app/providers.tsx`，如果只有 Firebase/Auth 相關程式碼，將整個檔案改為：

```typescript
'use client'
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 5: 更新 `src/app/(parent)/layout.tsx` 和 `src/app/(student)/layout.tsx`**

讀取這兩個檔案，移除所有 auth guard（`useAuth`、redirect to `/login` 的邏輯）。保留 layout 的 HTML 結構。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "移除 Firebase Auth：刪除登入頁、auth hooks、middleware；App 直接進入 Dashboard"
```

---

## Task 5: 路由遷移（動態路由 → query params）

**Files:**
- Rename+Modify: `src/app/(student)/[studentId]/home/page.tsx` → `src/app/(student)/home/page.tsx`
- Rename+Modify: `src/app/(student)/[studentId]/practice/page.tsx` → `src/app/(student)/practice/page.tsx`
- Rename+Modify: `src/app/(student)/[studentId]/summary/page.tsx` → `src/app/(student)/summary/page.tsx`
- Rename+Modify: `src/app/(student)/[studentId]/extension/page.tsx` → `src/app/(student)/extension/page.tsx`
- Rename+Modify: `src/app/(parent)/students/[studentId]/page.tsx` → `src/app/(parent)/students/settings/page.tsx`

**說明：** 靜態輸出不支援未知的動態路由，改用 query param `?id=xxx`。原本 `params.studentId`（string）改為 `useSearchParams().get('id')`（需轉成 number：`Number(searchParams.get('id'))`）。

- [ ] **Step 1: 建立新目錄、移動學生端頁面**

```bash
mkdir -p "src/app/(student)/home"
mkdir -p "src/app/(student)/practice"
mkdir -p "src/app/(student)/summary"
mkdir -p "src/app/(student)/extension"
mkdir -p "src/app/(parent)/students/settings"

cp "src/app/(student)/[studentId]/home/page.tsx" "src/app/(student)/home/page.tsx"
cp "src/app/(student)/[studentId]/practice/page.tsx" "src/app/(student)/practice/page.tsx"
cp "src/app/(student)/[studentId]/summary/page.tsx" "src/app/(student)/summary/page.tsx"
cp "src/app/(student)/[studentId]/extension/page.tsx" "src/app/(student)/extension/page.tsx"
cp "src/app/(parent)/students/[studentId]/page.tsx" "src/app/(parent)/students/settings/page.tsx"
```

- [ ] **Step 2: 在每個新建頁面頂部加入 Suspense + useSearchParams**

每個頁面的修改模式如下（以 `home/page.tsx` 為例）：

```typescript
// 在頁面頂部加入
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// 將原本的 export default function 改名，例如：
function HomePageContent() {
  const searchParams = useSearchParams()
  const studentId = Number(searchParams.get('id'))
  // 原本用 params.studentId 的地方都改成 studentId
  // ...原本的內容...
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <HomePageContent />
    </Suspense>
  )
}
```

對以下 5 個檔案都做相同的修改：
- `src/app/(student)/home/page.tsx`
- `src/app/(student)/practice/page.tsx`
- `src/app/(student)/summary/page.tsx`
- `src/app/(student)/extension/page.tsx`
- `src/app/(parent)/students/settings/page.tsx`

- [ ] **Step 3: 更新所有導航連結**

全域搜尋以下模式並替換：
- `router.push(`/${studentId}/home`)` → `router.push(`/home?id=${studentId}`)`
- `router.replace(`/${studentId}/home`)` → `router.replace(`/home?id=${studentId}`)`
- `href={\`/${studentId}/practice\`}` → `href={\`/practice?id=${studentId}\`}`
- `href={\`/${studentId}/summary\`}` → `href={\`/summary?id=${studentId}\`}`
- `href={\`/${studentId}/extension\`}` → `href={\`/extension?id=${studentId}\`}`
- `href={\`/students/${studentId}\`}` → `href={\`/students/settings?id=${studentId}\`}`

- [ ] **Step 4: 刪除舊的 [studentId] 目錄**

```bash
rm -rf "src/app/(student)/[studentId]"
rm -rf "src/app/(parent)/students/[studentId]"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "路由遷移：動態路由 [studentId] 改為 query param ?id=xxx，相容靜態輸出"
```

---

## Task 6: Cloudflare Worker（Gemini 代理）

**Files:**
- Create: `worker/index.js`
- Create: `worker/wrangler.toml`

- [ ] **Step 1: 建立 `worker/wrangler.toml`**

```toml
name = "chinese-learning-ai"
main = "index.js"
compatibility_date = "2024-01-01"
```

- [ ] **Step 2: 建立 `worker/index.js`**

```javascript
const CONTENT_PROMPT = `You are a Taiwanese elementary school Chinese teacher creating learning materials.

Target character: {character}
Student grade: {grade} (1-6, where 1 is easiest)

Generate learning content for this character suitable for grade {grade} students.
Use Traditional Chinese (繁體中文) only.
Use Bopomofo (注音符號) for phonetic annotation.

Return ONLY valid JSON:
{
  "vocabulary": "大樹",
  "vocabularyBopomofo": "ㄉㄚˋ ㄕㄨˋ",
  "sentence": "公園裡有一棵大樹。",
  "sentenceBopomofo": "ㄍㄨㄥ ㄩㄢˊ ㄌㄧˇ ㄧㄡˇ ㄧ ㄎㄜ ㄉㄚˋ ㄕㄨˋ。",
  "readingText": "公園裡有一棵大樹。大樹的葉子是綠色的。小朋友喜歡在大樹下玩。"
}

Rules:
- vocabulary: 2–3 characters containing the target character, common and age-appropriate
- vocabularyBopomofo: exact Bopomofo with tones for each syllable, space-separated
- sentence: 10–20 characters, simple grammar for grade {grade}
- sentenceBopomofo: exact Bopomofo for the full sentence
- readingText: 2–3 simple sentences forming a coherent passage`

const EXTENSION_PROMPT = `You are a Taiwanese elementary school Chinese teacher.

Target character: {character}
Student grade: {grade}

Generate extension learning content. Return ONLY the fields applicable for grade {grade}:
- Grade 1+: confusableChars, wordFormation, semanticRelation
- Grade 3+: additionally multiPronunciation, synonyms, antonyms
- Grade 5+: additionally idioms, rhetoric

Return ONLY valid JSON with the applicable fields. Omit fields not applicable for grade {grade}.

Field formats:
{
  "confusableChars": [{ "char": "己", "explanation": "「己」自己，「已」已經" }],
  "wordFormation": ["大樹", "樹木", "果樹"],
  "semanticRelation": ["森林", "植物"],
  "multiPronunciation": [{ "pronunciation": "ㄕㄨˋ", "meaning": "樹木", "example": "大樹" }],
  "synonyms": ["樹木"],
  "antonyms": [],
  "idioms": [{ "idiom": "樹大根深", "meaning": "比喻根基穩固" }],
  "rhetoric": [{ "type": "擬人", "example": "大樹張開雙臂歡迎小鳥。" }]
}

Rules:
- confusableChars: max 3, only genuinely confusable
- wordFormation: 4–6 common compound words
- semanticRelation: 3–5 related words
- Traditional Chinese only`

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  return JSON.parse(text)
}

export default {
  async fetch(request, env) {
    // CORS headers for GitHub Pages
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { character, grade } = await request.json()
    if (!character || !grade) {
      return new Response(JSON.stringify({ error: 'Missing character or grade' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.GEMINI_API_KEY

    // Core content
    const core = await callGemini(apiKey,
      CONTENT_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
    )

    // 1s delay between two Gemini calls
    await new Promise(r => setTimeout(r, 1000))

    // Extension content
    const extRaw = await callGemini(apiKey,
      EXTENSION_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
    )

    const extensions = {
      confusableChars: extRaw.confusableChars ?? [],
      wordFormation: extRaw.wordFormation ?? [],
      semanticRelation: extRaw.semanticRelation ?? [],
      multiPronunciation: grade >= 3 ? (extRaw.multiPronunciation ?? []) : [],
      synonyms: grade >= 3 ? (extRaw.synonyms ?? []) : [],
      antonyms: grade >= 3 ? (extRaw.antonyms ?? []) : [],
      idioms: grade >= 5 ? (extRaw.idioms ?? []) : [],
      rhetoric: grade >= 5 ? (extRaw.rhetoric ?? []) : [],
    }

    const result = {
      vocabulary: core.vocabulary ?? '',
      vocabularyBopomofo: core.vocabularyBopomofo ?? '',
      sentence: core.sentence ?? '',
      sentenceBopomofo: core.sentenceBopomofo ?? '',
      readingText: core.readingText ?? '',
      extensions,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
```

- [ ] **Step 3: 部署 Worker（在 terminal 執行）**

```bash
cd worker
npx wrangler deploy
npx wrangler secret put GEMINI_API_KEY
# 輸入 Gemini API Key 後按 Enter
cd ..
```

部署後，記下 Worker URL（格式：`https://chinese-learning-ai.<你的帳號>.workers.dev`）。

- [ ] **Step 4: 在前端設定 Worker URL**

在專案根目錄建立 `.env.local`（此檔案不會進入 git）：

```
NEXT_PUBLIC_AI_WORKER_URL=https://chinese-learning-ai.<你的帳號>.workers.dev
```

在 `.gitignore` 確認 `.env.local` 已被排除（通常預設就有）。

- [ ] **Step 5: Commit**

```bash
git add worker/
git commit -m "新增 Cloudflare Worker：保管 Gemini API Key，代理 AI 內容生成"
```

---

## Task 7: 課程匯入頁改寫（全瀏覽器端）

**Files:**
- Modify: `src/lib/docx/parser.ts`
- Modify: `src/app/(parent)/courses/import/page.tsx`

**說明：** 原本流程「上傳 → /api/pdf → /api/generate → polling Firestore」改為「瀏覽器解析 → 存 IndexedDB → 逐字呼叫 Worker → 存結果到 IndexedDB」。

- [ ] **Step 1: 更新 `src/lib/docx/parser.ts`（改用 arrayBuffer）**

```typescript
import mammoth from 'mammoth'

export interface ParsedCharacter {
  character: string
  strokeCount: null
  radical: null
}

export async function parseDocxCharacters(arrayBuffer: ArrayBuffer): Promise<ParsedCharacter[]> {
  const result = await mammoth.extractRawText({ arrayBuffer })
  const uniqueChars = [...new Set((result.value.match(/[一-鿿]/g) ?? []))]
  return uniqueChars.map((character) => ({ character, strokeCount: null, radical: null }))
}
```

- [ ] **Step 2: 建立 AI 生成的客戶端呼叫函式**

在 `src/lib/db/generated-content.ts` 底部加入（讀取檔案後在末尾 append）：

```typescript
export async function generateAndSaveCharacter(
  characterId: string,
  courseId: number,
  character: string,
  grade: number
): Promise<void> {
  await saveGeneratedContent({
    characterId, courseId, grade, character,
    vocabulary: '', vocabularyBopomofo: '',
    sentence: '', sentenceBopomofo: '',
    readingText: '',
    extensions: {
      confusableChars: [], wordFormation: [], semanticRelation: [],
      multiPronunciation: [], synonyms: [], antonyms: [], idioms: [], rhetoric: [],
    },
    status: 'pending',
  })

  try {
    const workerUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL
    const res = await fetch(`${workerUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, grade }),
    })
    const content = await res.json()
    await saveGeneratedContent({
      characterId, courseId, grade, character,
      ...content,
      status: 'ready',
      generatedAt: Date.now(),
    })
  } catch (err) {
    await saveGeneratedContent({
      characterId, courseId, grade, character,
      vocabulary: '', vocabularyBopomofo: '',
      sentence: '', sentenceBopomofo: '',
      readingText: '',
      extensions: {
        confusableChars: [], wordFormation: [], semanticRelation: [],
        multiPronunciation: [], synonyms: [], antonyms: [], idioms: [], rhetoric: [],
      },
      status: 'error',
      errorMessage: String(err),
    })
  }
}
```

- [ ] **Step 3: 改寫 `src/app/(parent)/courses/import/page.tsx`**

讀取目前的 import page，然後做以下修改：

1. **移除所有 Firebase/Auth import**：`getIdToken`、`auth`、`useAuth`、`getCourse`、Firebase 的 `createCourse`
2. **改用 Dexie**：`import { createCourse, updateCourseStatus } from '@/lib/db/courses'`
3. **移除 polling**（不需要再 poll Firestore），改為在前端直接追蹤進度
4. **handleUpload 改為**：
   - 讀取 File 的 `arrayBuffer`
   - 呼叫 `parseDocxCharacters(arrayBuffer)` 直接取得字元陣列
   - 呼叫 `saveCharacters(courseId, parsedChars)` 存到 IndexedDB
   - 呼叫 `updateCourseStatus(courseId, 'ai_generating', { characterCount: parsedChars.length })`
   - 用 for loop（含 6s delay）逐字呼叫 `generateAndSaveCharacter`
   - 最後 `updateCourseStatus(courseId, 'ready', { readyAt: Date.now() })`
5. **移除 courseId polling effect**，改為 React state 追蹤「已完成幾個」
6. **`handleFormSubmit` 的 `importedBy` 欄位移除**（不再需要 userId）

**改寫後的核心 handleUpload 邏輯：**

```typescript
async function handleUpload() {
  if (!selectedFile || !courseId) return
  setUploading(true)
  setUploadError(null)

  try {
    const arrayBuffer = await selectedFile.arrayBuffer()
    const parsedChars = await parseDocxCharacters(arrayBuffer)

    if (parsedChars.length === 0) {
      setUploadError('未能從文件中讀取到漢字，請確認文件內容')
      setUploading(false)
      return
    }

    const charIds = await saveCharacters(courseId, parsedChars)
    await updateCourseStatus(courseId, 'ai_generating', { characterCount: parsedChars.length })
    setCharacterCount(parsedChars.length)
    setCourseStatus('ai_generating')
    setStep('processing')

    for (let i = 0; i < parsedChars.length; i++) {
      await generateAndSaveCharacter(charIds[i], courseId, parsedChars[i].character, form.grade)
      setGeneratedCount(i + 1)  // 新增 state: generatedCount
      if (i < parsedChars.length - 1) {
        await new Promise(r => setTimeout(r, 6000))
      }
    }

    await updateCourseStatus(courseId, 'ready', { readyAt: Date.now() })
    setCourseStatus('ready')
    setStep('done')
  } catch (err) {
    setUploadError('處理失敗：' + String(err))
    await updateCourseStatus(courseId, 'error')
  } finally {
    setUploading(false)
  }
}
```

**processing 區塊的 UI 改為顯示進度：**

```tsx
{step === 'processing' && (
  <div>
    <p className="text-lg text-gray-600">AI 生成中… {generatedCount} / {characterCount} 個生字</p>
    {/* 原本的 loading dots 動畫保留 */}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/docx/parser.ts src/app/(parent)/courses/import/ src/lib/db/generated-content.ts
git commit -m "課程匯入：移除 API 路由依賴，改為瀏覽器端解析 + Worker AI 生成 + IndexedDB 儲存"
```

---

## Task 8: 剩餘頁面改用 Dexie

**Files:**
- Modify: `src/app/(parent)/dashboard/page.tsx`
- Modify: `src/app/(parent)/students/new/page.tsx`
- Modify: `src/app/(parent)/students/settings/page.tsx`
- Modify: `src/app/(parent)/courses/page.tsx`
- Modify: `src/hooks/usePracticeSession.ts`
- Modify: `src/hooks/useWrongBook.ts`

**說明：** 讀取每個檔案，找出 Firebase import 並替換成對應的 Dexie 函式。

- [ ] **Step 1: `dashboard/page.tsx`**

找出 `getStudentsByParent(user.uid)` 相關程式碼，改為 `getAllStudents()`（來自 `src/lib/db/students.ts`）。移除 `useAuth` 使用。

- [ ] **Step 2: `students/new/page.tsx`**

找出 `createStudent(user.uid, name, grade)` 相關程式碼，改為 `createStudent(name, grade)`（來自 `src/lib/db/students.ts`，不需要 userId）。

- [ ] **Step 3: `students/settings/page.tsx`**

找出所有 Firebase 操作（`getStudent`、`updateStudent`、`deleteStudent`、`getStudentCourses`、`linkCourse`、`unlinkCourse`），替換為 Dexie 對應函式。studentId 從 `useSearchParams` 取得（已在 Task 5 完成），要加上 `Number()` 轉換。

- [ ] **Step 4: `courses/page.tsx`**

找出 `getCourses` 或類似的 Firebase 函式，改為 `getAllCourses()`（來自 `src/lib/db/courses.ts`）。

- [ ] **Step 5: `usePracticeSession.ts`**

讀取整個檔案，找出所有 Firebase 操作：
- 讀取 `generatedContent` → 改用 `getGeneratedContentByCourse`
- 讀取 `wrongBook` → 改用 `getWrongBook`
- 寫入 `practiceHistory` → 改用 `recordPractice`
- 寫入 `wrongBook` → 改用 `addToWrongBook`

所有 Firebase Timestamp 改用 `Date.now()`。

- [ ] **Step 6: `useWrongBook.ts`**

讀取整個檔案，找出所有 Firebase 操作，替換為 Dexie 對應函式（`getWrongBook`、`addToWrongBook`、`removeFromWrongBook`）。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "所有頁面和 hooks：Firebase → Dexie，完成資料層遷移"
```

---

## Task 9: 清理與最終建置

**Files:**
- Delete: `src/app/api/` (整個目錄)
- Delete: `src/lib/gemini/client.ts` (原本的 Firebase-dependent 版本)

- [ ] **Step 1: 刪除不再需要的 API 路由和舊 Gemini client**

```bash
rm -rf src/app/api
rm -f src/lib/gemini/client.ts
```

（`src/lib/gemini/content-generator.ts` 也可刪除，功能已移到 Worker）

```bash
rm -f src/lib/gemini/content-generator.ts
```

- [ ] **Step 2: 移除 `src/types/next-pwa.d.ts`（next-pwa 已移除）**

```bash
rm -f src/types/next-pwa.d.ts
```

- [ ] **Step 3: 試跑建置確認沒有錯誤**

```bash
npm run build
```

如果有 TypeScript 錯誤，逐一修正（主要是 `Timestamp` 殘留、Firebase import 殘留、`parentId`/`importedBy` 殘留）。

- [ ] **Step 4: 最終 Commit**

```bash
git add -A
git commit -m "清理：移除 API routes、舊 Gemini client、next-pwa 型別定義；確認靜態建置成功"
```

---

## Task 10: GitHub Pages 部署設定與平台清理

- [ ] **Step 1: 在 GitHub 上啟用 Pages**

1. 前往 GitHub → 你的 `chinese-character-learning` repo
2. Settings → Pages
3. Source: 選 **GitHub Actions**
4. 儲存

- [ ] **Step 2: Push 觸發自動部署**

```bash
git push origin main
```

等 GitHub Actions 跑完（約 2-3 分鐘），前往 `https://<你的帳號>.github.io/chinese-character-learning/` 確認可以開啟。

- [ ] **Step 3: 刪除 Firebase 專案（手動）**

1. 前往 https://console.firebase.google.com/
2. 選擇 `spry-sequence-497002-k8` 專案
3. 專案設定（齒輪圖示）→ 一般設定 → 最底部 → 「刪除專案」
4. 輸入專案 ID 確認

- [ ] **Step 4: 刪除 Vercel 專案（手動）**

1. 前往 https://vercel.com/dashboard
2. 找到 `chinese-character-learning` 專案
3. Settings → 最底部 → Delete Project
4. 確認刪除

- [ ] **Step 5: 在平板上測試完整流程**

用平板開啟 `https://<你的帳號>.github.io/chinese-character-learning/`，確認：
1. 直接進入 Dashboard（不需登入）
2. 新增學生
3. 匯入課程（手動輸入文字）
4. AI 生字生成完成
5. 學生練習功能正常
6. 錯字本功能正常

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
  id?: string            // courseId_0001 format
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
  definition?: string
  radical?: string | null
  strokeCount?: number | null
  extensions: Extensions
  status: 'pending' | 'ready' | 'error'
  errorMessage?: string
  generatedAt?: number   // Unix ms
}

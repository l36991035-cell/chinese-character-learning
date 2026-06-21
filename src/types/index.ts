import { Timestamp } from 'firebase/firestore'

// ─── Practice Mode ───────────────────────────────────────────────────────────

export type PracticeMode = 'vocabulary' | 'sentence' | 'wrongbook' | 'extension'

// ─── Publisher / Course Status ────────────────────────────────────────────────

export type Publisher = '康軒' | '南一' | '翰林'
export type CourseStatus = 'uploading' | 'parsing' | 'ai_generating' | 'ready' | 'error'

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  email: string
  displayName: string
  photoURL: string
  createdAt: Timestamp
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface Student {
  parentId: string          // userId of parent
  name: string              // 哥哥 / 妹妹
  grade: 1 | 2 | 3 | 4 | 5 | 6
  createdAt: Timestamp
  enabledExtensions: {
    confusableChars: boolean      // 易混淆字 (grade 1+)
    wordFormation: boolean        // 造詞 (grade 1+)
    semanticRelation: boolean     // 找朋友 (grade 1+)
    multiPronunciation: boolean   // 多音字 (grade 3+)
    synonyms: boolean             // 同義詞 (grade 3+)
    antonyms: boolean             // 反義詞 (grade 3+)
    idioms: boolean               // 成語 (grade 5+)
    rhetoric: boolean             // 修辭 (grade 5+)
  }
}

// ─── StudentCourse (subcollection: students/{studentId}/courses/{courseId}) ──

export interface StudentCourse {
  linkedAt: Timestamp
  selectedLessons: number[]   // [5, 6, 7] = 第五、六、七課
}

// ─── WrongBookEntry (subcollection: students/{studentId}/wrongbook/{charId}) ─

export interface WrongBookEntry {
  characterId: string
  character: string
  courseId: string
  grade: number
  addedAt: Timestamp
  wrongCount: number
  lastPracticedAt: Timestamp | null
}

// ─── PracticeHistory (subcollection: students/{studentId}/practice_history/) ─

export interface PracticeHistory {
  characterId: string
  character: string
  courseId: string
  sessionId: string
  practiceMode: PracticeMode
  isCorrect: boolean
  practicedAt: Timestamp
}

// ─── Course (/courses/{courseId}) ────────────────────────────────────────────

export interface Course {
  importedBy: string          // userId
  publisher: Publisher
  grade: 1 | 2 | 3 | 4 | 5 | 6
  semester: 1 | 2
  lessonNumber: number
  lessonTitle: string
  characterCount: number
  status: CourseStatus
  errorMessage?: string
  importedAt: Timestamp
  readyAt?: Timestamp
}

// ─── Character (/characters/{charId}) ────────────────────────────────────────

export interface Character {
  courseId: string
  character: string           // '樹'
  strokeCount: number         // 16
  radical: string             // '木'
  order: number               // 1, 2, 3...
}

// ─── Extensions (nested inside GeneratedContent) ─────────────────────────────

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

// ─── GeneratedContent (/generated_content/{charId}) ──────────────────────────

export interface GeneratedContent {
  characterId: string
  courseId: string
  grade: number
  character: string
  vocabulary: string              // '大樹'
  vocabularyBopomofo: string      // 'ㄉㄚˋ ㄕㄨˋ'
  sentence: string                // '公園裡有一棵大樹。'
  sentenceBopomofo: string        // 'ㄍㄨㄥ ㄩㄢˊ ㄌㄧˇ ㄧㄡˇ ㄧ ㄎㄜ ㄉㄚˋ ㄕㄨˋ。'
  readingText: string             // 2–3 句朗讀文字
  extensions: Extensions
  status: 'pending' | 'ready' | 'error'
  errorMessage?: string
  generatedAt?: Timestamp
}

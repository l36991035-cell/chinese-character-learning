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

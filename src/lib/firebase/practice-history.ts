import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './client'
import type { PracticeMode } from '@/types'

export async function recordPractice(
  studentId: string,
  data: {
    characterId: string
    character: string
    courseId: string
    sessionId: string
    practiceMode: PracticeMode
    isCorrect: boolean
  }
): Promise<void> {
  await addDoc(collection(db, 'students', studentId, 'practice_history'), {
    ...data,
    practicedAt: serverTimestamp(),
  })
}

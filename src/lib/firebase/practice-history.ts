import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './client'
import type { PracticeMode, PracticeHistory } from '@/types'

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

export async function getTodayPractice(
  studentId: string
): Promise<Array<PracticeHistory & { id: string }>> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const q = query(
    collection(db, 'students', studentId, 'practice_history'),
    where('practicedAt', '>=', Timestamp.fromDate(startOfToday))
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PracticeHistory) }))
}

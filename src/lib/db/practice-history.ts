import { db } from './index'
import type { PracticeHistory } from '@/types'

export async function recordPractice(entry: Omit<PracticeHistory, 'id' | 'practicedAt'>): Promise<void> {
  await db.practiceHistory.add({ ...entry, practicedAt: Date.now() })
}

export async function getPracticeHistory(studentId: number): Promise<PracticeHistory[]> {
  return db.practiceHistory.where('studentId').equals(studentId).sortBy('practicedAt')
}

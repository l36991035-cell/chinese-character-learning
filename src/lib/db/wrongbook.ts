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

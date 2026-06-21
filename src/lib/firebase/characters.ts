import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from './client'
import type { Character } from '@/types'

export async function batchWriteCharacters(
  courseId: string,
  chars: Array<Omit<Character, 'courseId'>>
): Promise<string[]> {
  const charIds: string[] = []
  // Firestore batch max 500 writes; split if needed
  const BATCH_SIZE = 500
  for (let start = 0; start < chars.length; start += BATCH_SIZE) {
    const slice = chars.slice(start, start + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const char of slice) {
      const charId = `${courseId}_${String(char.order).padStart(3, '0')}`
      charIds.push(charId)
      batch.set(doc(collection(db, 'characters'), charId), {
        courseId,
        character: char.character,
        strokeCount: char.strokeCount ?? null,
        radical: char.radical ?? null,
        order: char.order,
      })
    }
    await batch.commit()
  }
  return charIds
}

export async function getCharactersByCourse(
  courseId: string
): Promise<Array<Character & { id: string }>> {
  const q = query(
    collection(db, 'characters'),
    where('courseId', '==', courseId),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Character & { id: string }))
}

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

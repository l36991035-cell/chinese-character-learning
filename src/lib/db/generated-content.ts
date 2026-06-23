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

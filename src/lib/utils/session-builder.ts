import type { Character, GeneratedContent, WrongBookEntry } from '@/types'

export interface PracticeItem {
  characterId: string
  character: string
  courseId: number
  grade: number
  content: GeneratedContent
  isFromWrongBook: boolean
}

export function buildPracticeSession(
  wrongBookItems: Array<WrongBookEntry & { id: number }>,
  courseCharacters: Array<{ char: Character & { id: string }; content: GeneratedContent }>,
  grade: number
): PracticeItem[] {
  const items: PracticeItem[] = []
  const wrongBookCharIds = new Set(wrongBookItems.map((w) => w.characterId))

  // Wrong book items first (only those that also appear in the current course)
  for (const wb of wrongBookItems) {
    const courseItem = courseCharacters.find((c) => c.char.id === wb.characterId)
    if (courseItem) {
      items.push({
        characterId: wb.characterId,
        character: wb.character,
        courseId: wb.courseId,
        grade,
        content: courseItem.content,
        isFromWrongBook: true,
      })
    }
  }

  // Then regular course characters (skip those already in wrong book)
  for (const { char, content } of courseCharacters) {
    if (!wrongBookCharIds.has(char.id!)) {
      items.push({
        characterId: char.id!,
        character: char.character,
        courseId: char.courseId,
        grade,
        content,
        isFromWrongBook: false,
      })
    }
  }

  return items
}

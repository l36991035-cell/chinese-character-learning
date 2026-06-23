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

export async function generateAndSaveContent(
  character: string,
  grade: number,
  courseId: number,
  characterId: string
): Promise<void> {
  const workerUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL
  if (!workerUrl) throw new Error('NEXT_PUBLIC_AI_WORKER_URL is not set')

  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character, grade }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Worker error ${res.status}: ${errText}`)
  }

  const data = await res.json()

  await saveGeneratedContent({
    characterId,
    courseId,
    grade,
    character,
    vocabulary: data.vocabulary ?? '',
    vocabularyBopomofo: data.vocabularyBopomofo ?? '',
    sentence: data.sentence ?? '',
    sentenceBopomofo: data.sentenceBopomofo ?? '',
    readingText: data.readingText ?? '',
    extensions: data.extensions ?? {
      confusableChars: [],
      wordFormation: [],
      semanticRelation: [],
      multiPronunciation: [],
      synonyms: [],
      antonyms: [],
      idioms: [],
      rhetoric: [],
    },
    status: 'ready',
    generatedAt: Date.now(),
  })
}

export async function generateAndSaveCharacter(
  characterId: string,
  courseId: number,
  character: string,
  grade: number
): Promise<void> {
  await saveGeneratedContent({
    characterId, courseId, grade, character,
    vocabulary: '', vocabularyBopomofo: '',
    sentence: '', sentenceBopomofo: '',
    readingText: '',
    extensions: {
      confusableChars: [], wordFormation: [], semanticRelation: [],
      multiPronunciation: [], synonyms: [], antonyms: [], idioms: [], rhetoric: [],
    },
    status: 'pending',
  })

  try {
    const workerUrl = process.env.NEXT_PUBLIC_AI_WORKER_URL
    const res = await fetch(`${workerUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character, grade }),
    })
    const content = await res.json()
    await saveGeneratedContent({
      characterId, courseId, grade, character,
      ...content,
      status: 'ready',
      generatedAt: Date.now(),
    })
  } catch (err) {
    await saveGeneratedContent({
      characterId, courseId, grade, character,
      vocabulary: '', vocabularyBopomofo: '',
      sentence: '', sentenceBopomofo: '',
      readingText: '',
      extensions: {
        confusableChars: [], wordFormation: [], semanticRelation: [],
        multiPronunciation: [], synonyms: [], antonyms: [], idioms: [], rhetoric: [],
      },
      status: 'error',
      errorMessage: String(err),
    })
  }
}

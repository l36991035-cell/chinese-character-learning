import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './client'
import type { GeneratedContent } from '@/types'

export async function writeGeneratedContent(
  charId: string,
  content: Omit<GeneratedContent, 'status' | 'generatedAt' | 'errorMessage'>
): Promise<void> {
  await setDoc(doc(db, 'generated_content', charId), {
    ...content,
    status: 'ready' as const,
    generatedAt: serverTimestamp(),
  })
}

export async function getGeneratedContent(charId: string): Promise<GeneratedContent | null> {
  const snap = await getDoc(doc(db, 'generated_content', charId))
  return snap.exists() ? (snap.data() as GeneratedContent) : null
}

import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './client'
import type { WrongBookEntry } from '@/types'

export async function addToWrongBook(
  studentId: string,
  entry: {
    characterId: string
    character: string
    courseId: string
    grade: number
  }
): Promise<void> {
  const ref = doc(db, 'students', studentId, 'wrongbook', entry.characterId)
  // Create doc if not exists (merge keeps existing fields)
  await setDoc(
    ref,
    {
      characterId: entry.characterId,
      character: entry.character,
      courseId: entry.courseId,
      grade: entry.grade,
      addedAt: serverTimestamp(),
      wrongCount: 0,
      lastPracticedAt: null,
    },
    { merge: true }
  )
  // Always increment wrongCount
  await updateDoc(ref, { wrongCount: increment(1) })
}

export async function removeFromWrongBook(
  studentId: string,
  characterId: string
): Promise<void> {
  await deleteDoc(doc(db, 'students', studentId, 'wrongbook', characterId))
}

export async function getWrongBook(
  studentId: string
): Promise<Array<WrongBookEntry & { id: string }>> {
  const snap = await getDocs(collection(db, 'students', studentId, 'wrongbook'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as WrongBookEntry) }))
}

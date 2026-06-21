import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './client'
import type { Course, Publisher } from '@/types'

export async function createCourse(data: {
  importedBy: string
  publisher: Publisher
  grade: Course['grade']
  semester: 1 | 2
  lessonNumber: number
  lessonTitle: string
}): Promise<string> {
  const ref = await addDoc(collection(db, 'courses'), {
    ...data,
    characterCount: 0,
    status: 'uploading' as const,
    importedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const snap = await getDoc(doc(db, 'courses', courseId))
  if (!snap.exists()) return null
  return snap.data() as Course
}

export async function updateCourseStatus(
  courseId: string,
  status: Course['status'],
  extra?: Partial<Course>
): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId), { status, ...extra })
}

export async function getCoursesByImporter(
  userId: string
): Promise<Array<Course & { id: string }>> {
  const q = query(
    collection(db, 'courses'),
    where('importedBy', '==', userId),
    orderBy('importedAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Course & { id: string }))
}

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './client'
import { getDefaultExtensions } from '@/lib/utils/grade-extensions'
import type { Student } from '@/types'

export async function createStudent(
  parentId: string,
  name: string,
  grade: Student['grade']
) {
  const enabledExtensions = getDefaultExtensions(grade)
  const docRef = await addDoc(collection(db, 'students'), {
    parentId,
    name,
    grade,
    enabledExtensions,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateStudent(
  studentId: string,
  data: Partial<Omit<Student, 'parentId' | 'createdAt'>>
) {
  await updateDoc(doc(db, 'students', studentId), { ...data })
}

export async function getStudentsByParent(parentId: string): Promise<Array<Student & { id: string }>> {
  const q = query(
    collection(db, 'students'),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Student & { id: string }))
}

export async function deleteStudent(studentId: string) {
  await deleteDoc(doc(db, 'students', studentId))
}

export async function linkCourseToStudent(
  studentId: string,
  courseId: string,
  lessonNumber: number
): Promise<void> {
  await setDoc(doc(db, 'students', studentId, 'courses', courseId), {
    linkedAt: serverTimestamp(),
    selectedLessons: [lessonNumber],
  })
}

export async function unlinkCourseFromStudent(
  studentId: string,
  courseId: string
): Promise<void> {
  await deleteDoc(doc(db, 'students', studentId, 'courses', courseId))
}

export async function getStudentCourses(
  studentId: string
): Promise<Array<{ courseId: string; linkedAt: Timestamp; selectedLessons: number[] }>> {
  const snapshot = await getDocs(collection(db, 'students', studentId, 'courses'))
  return snapshot.docs.map((d) => ({
    courseId: d.id,
    ...(d.data() as { linkedAt: Timestamp; selectedLessons: number[] }),
  }))
}

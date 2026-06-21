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
  serverTimestamp,
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

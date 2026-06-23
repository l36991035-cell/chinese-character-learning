import { db } from './index'
import { getDefaultExtensions } from '@/lib/utils/grade-extensions'
import type { Student, StudentCourse } from '@/types'

export async function createStudent(name: string, grade: Student['grade']): Promise<number> {
  return db.students.add({
    name,
    grade,
    createdAt: Date.now(),
    enabledExtensions: getDefaultExtensions(grade),
  })
}

export async function getAllStudents(): Promise<Array<Student & { id: number }>> {
  return db.students.orderBy('createdAt').toArray() as Promise<Array<Student & { id: number }>>
}

export async function getStudent(id: number): Promise<(Student & { id: number }) | undefined> {
  return db.students.get(id) as Promise<(Student & { id: number }) | undefined>
}

export async function updateStudent(id: number, data: Partial<Omit<Student, 'id' | 'createdAt'>>): Promise<void> {
  await db.students.update(id, data)
}

export async function deleteStudent(id: number): Promise<void> {
  await db.transaction('rw', db.students, db.studentCourses, db.wrongBook, db.practiceHistory, async () => {
    await db.students.delete(id)
    await db.studentCourses.where('studentId').equals(id).delete()
    await db.wrongBook.where('studentId').equals(id).delete()
    await db.practiceHistory.where('studentId').equals(id).delete()
  })
}

export async function linkCourseToStudent(studentId: number, courseId: number, lessonNumber: number): Promise<void> {
  await db.transaction('rw', db.studentCourses, async () => {
    const existing = await db.studentCourses
      .where('[studentId+courseId]').equals([studentId, courseId]).first()
    if (existing) {
      await db.studentCourses.update(existing.id!, {
        selectedLessons: [...new Set([...(existing.selectedLessons ?? []), lessonNumber])],
      })
    } else {
      await db.studentCourses.add({ studentId, courseId, linkedAt: Date.now(), selectedLessons: [lessonNumber] })
    }
  })
}

export async function unlinkCourseFromStudent(studentId: number, courseId: number): Promise<void> {
  await db.studentCourses.where('[studentId+courseId]').equals([studentId, courseId]).delete()
}

export async function getStudentCourses(studentId: number): Promise<StudentCourse[]> {
  return db.studentCourses.where('studentId').equals(studentId).toArray()
}

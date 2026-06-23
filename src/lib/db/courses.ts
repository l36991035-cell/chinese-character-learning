import { db } from './index'
import type { Course, CourseStatus } from '@/types'

export async function createCourse(data: Omit<Course, 'id' | 'characterCount' | 'status' | 'importedAt'>): Promise<number> {
  return db.courses.add({
    ...data,
    characterCount: 0,
    status: 'uploading',
    importedAt: Date.now(),
  })
}

export async function getCourse(id: number): Promise<(Course & { id: number }) | undefined> {
  return db.courses.get(id) as Promise<(Course & { id: number }) | undefined>
}

export async function getAllCourses(): Promise<Array<Course & { id: number }>> {
  return db.courses.orderBy('importedAt').reverse().toArray() as Promise<Array<Course & { id: number }>>
}

export async function updateCourseStatus(id: number, status: CourseStatus, extra?: Partial<Course>): Promise<void> {
  await db.courses.update(id, { status, ...extra })
}

export async function deleteCourse(id: number): Promise<void> {
  await db.transaction('rw', [db.courses, db.characters, db.generatedContent, db.studentCourses, db.wrongBook, db.practiceHistory], async () => {
    await db.courses.delete(id)
    const charIds = (await db.characters.where('courseId').equals(id).toArray()).map(c => c.id!)
    await db.characters.where('courseId').equals(id).delete()
    await db.generatedContent.bulkDelete(charIds)
    await db.studentCourses.where('courseId').equals(id).delete()
    await db.wrongBook.filter(e => e.courseId === id).delete()
    await db.practiceHistory.where('courseId').equals(id).delete()
  })
}

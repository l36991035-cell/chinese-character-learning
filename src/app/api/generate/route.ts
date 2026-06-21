import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase/admin'
import { generateCharacterContent } from '@/lib/openai/content-generator'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutes — may have many characters

export async function POST(request: NextRequest) {
  const { courseId } = await request.json() as { courseId: string }
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'Missing courseId' }, { status: 400 })
  }

  const { db: adminDb } = await getFirebaseAdmin()

  // Fetch the course to get grade
  const courseSnap = await adminDb.collection('courses').doc(courseId).get()
  if (!courseSnap.exists) {
    return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })
  }
  const courseData = courseSnap.data()!
  const grade = courseData.grade as number

  // Fetch all characters for this course
  const charsSnap = await adminDb.collection('characters')
    .where('courseId', '==', courseId)
    .orderBy('order')
    .get()

  const chars = charsSnap.docs.map(d => ({ id: d.id, ...d.data() as { character: string; order: number } }))
  let generated = 0
  let errors = 0

  // Process sequentially to avoid OpenAI rate limits
  for (const char of chars) {
    try {
      // Mark as pending in generated_content
      await adminDb.collection('generated_content').doc(char.id).set({
        characterId: char.id,
        courseId,
        grade,
        character: char.character,
        status: 'pending',
      }, { merge: true })

      // Generate content
      const content = await generateCharacterContent(char.character, grade, courseId, char.id)

      // Write to Firestore using Admin SDK
      await adminDb.collection('generated_content').doc(char.id).set({
        ...content,
        status: 'ready',
        generatedAt: new Date(),
      })
      generated++
    } catch (err) {
      console.error(`Failed to generate content for ${char.character}:`, err)
      await adminDb.collection('generated_content').doc(char.id).set({
        characterId: char.id,
        courseId,
        grade,
        character: char.character,
        status: 'error',
        errorMessage: String(err),
      }, { merge: true })
      errors++
    }
  }

  // Update course status
  const finalStatus = errors === chars.length ? 'error' : 'ready'
  await adminDb.collection('courses').doc(courseId).update({
    status: finalStatus,
    readyAt: new Date(),
  })

  return NextResponse.json({
    success: true,
    queued: chars.length,
    generated,
    errors,
  })
}

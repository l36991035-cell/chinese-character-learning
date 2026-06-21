import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase/admin'
import { parsePdfCharacters } from '@/lib/openai/pdf-parser'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const courseId = formData.get('courseId') as string | null

  if (!file || !courseId) {
    return NextResponse.json(
      { success: false, error: '缺少 file 或 courseId' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { db: adminDb } = await getFirebaseAdmin()

  // Update course status to 'parsing'
  await adminDb.collection('courses').doc(courseId).update({ status: 'parsing' })

  // Parse PDF via OpenAI Vision
  const parsedChars = await parsePdfCharacters(buffer)

  // Batch write characters to Firestore
  const batch = adminDb.batch()
  const charIds: string[] = []
  parsedChars.forEach((char, index) => {
    const order = index + 1
    const charId = `${courseId}_${String(order).padStart(3, '0')}`
    charIds.push(charId)
    batch.set(adminDb.collection('characters').doc(charId), {
      courseId,
      character: char.character,
      strokeCount: char.strokeCount ?? null,
      radical: char.radical ?? null,
      order,
    })
  })
  await batch.commit()

  // Update course: status='ai_generating', characterCount
  await adminDb.collection('courses').doc(courseId).update({
    status: 'ai_generating',
    characterCount: parsedChars.length,
  })

  // Trigger AI generation (fire-and-forget)
  const baseUrl = request.nextUrl.origin
  fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  }).catch(console.error)

  return NextResponse.json({
    success: true,
    courseId,
    characterCount: parsedChars.length,
    characters: charIds.map((id, i) => ({
      charId: id,
      character: parsedChars[i].character,
      strokeCount: parsedChars[i].strokeCount,
      radical: parsedChars[i].radical,
      order: i + 1,
    })),
  })
}

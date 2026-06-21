import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin, requireAuth } from '@/lib/firebase/admin'
import { parseDocxCharacters } from '@/lib/docx/parser'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  // Verify caller is authenticated
  try {
    await requireAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const courseId = formData.get('courseId') as string | null

  if (!file || !courseId) {
    return NextResponse.json({ success: false, error: '缺少 file 或 courseId' }, { status: 400 })
  }

  if (!file.name.endsWith('.docx')) {
    return NextResponse.json({ success: false, error: '請上傳 Word 文件（.docx）' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { db: adminDb } = await getFirebaseAdmin()

  await adminDb.collection('courses').doc(courseId).update({ status: 'parsing' })

  const parsedChars = await parseDocxCharacters(buffer)

  if (parsedChars.length === 0) {
    await adminDb.collection('courses').doc(courseId).update({ status: 'error' })
    return NextResponse.json({ success: false, error: '未能從文件中讀取到漢字，請確認文件內容' }, { status: 422 })
  }

  const batch = adminDb.batch()
  const charIds: string[] = []
  parsedChars.forEach((char, index) => {
    const order = index + 1
    const charId = `${courseId}_${String(order).padStart(3, '0')}`
    charIds.push(charId)
    batch.set(adminDb.collection('characters').doc(charId), {
      courseId,
      character: char.character,
      strokeCount: null,
      radical: null,
      order,
    })
  })
  await batch.commit()

  await adminDb.collection('courses').doc(courseId).update({
    status: 'ai_generating',
    characterCount: parsedChars.length,
  })

  // Await generate (not fire-and-forget) so serverless function stays alive
  const baseUrl = request.nextUrl.origin
  await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET ?? '',
    },
    body: JSON.stringify({ courseId }),
  }).catch(console.error)

  return NextResponse.json({
    success: true,
    courseId,
    characterCount: parsedChars.length,
    characters: charIds.map((id, i) => ({
      charId: id,
      character: parsedChars[i].character,
      strokeCount: null,
      radical: null,
      order: i + 1,
    })),
  })
}

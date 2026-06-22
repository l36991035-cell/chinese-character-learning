import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin, requireAuth } from '@/lib/firebase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: '請先登入' }, { status: 401 })
  }

  const { courseId, text } = await request.json() as { courseId?: string; text?: string }

  if (!courseId || !text) {
    return NextResponse.json({ success: false, error: '缺少 courseId 或 text' }, { status: 400 })
  }

  const uniqueChars = [...new Set((text.match(/[一-鿿]/g) ?? []))]

  if (uniqueChars.length === 0) {
    return NextResponse.json({ success: false, error: '未找到任何漢字，請確認輸入內容' }, { status: 422 })
  }

  const { db: adminDb } = await getFirebaseAdmin()

  await adminDb.collection('courses').doc(courseId).update({ status: 'parsing' })

  const batch = adminDb.batch()
  uniqueChars.forEach((character, index) => {
    const order = index + 1
    const charId = `${courseId}_${String(order).padStart(3, '0')}`
    batch.set(adminDb.collection('characters').doc(charId), {
      courseId,
      character,
      strokeCount: null,
      radical: null,
      order,
    })
  })
  await batch.commit()

  await adminDb.collection('courses').doc(courseId).update({
    status: 'ai_generating',
    characterCount: uniqueChars.length,
  })

  const baseUrl = request.nextUrl.origin
  await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET ?? '',
    },
    body: JSON.stringify({ courseId }),
  }).catch(console.error)

  return NextResponse.json({ success: true, courseId, characterCount: uniqueChars.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai/client'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const openai = getOpenAI()
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    response_format: 'mp3',
  })

  const arrayBuffer = await response.arrayBuffer()
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

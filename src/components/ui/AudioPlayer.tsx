'use client'
import { useState } from 'react'

export function AudioPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  async function handlePlay() {
    if (playing) return
    setPlaying(true)
    setError(false)
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => {
        setPlaying(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setPlaying(false)
        setError(true)
      }
      await audio.play()
    } catch {
      setPlaying(false)
      setError(true)
    }
  }

  return (
    <button
      onClick={handlePlay}
      disabled={playing}
      className="min-h-[64px] w-full flex items-center justify-center gap-3 text-xl font-medium rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors"
    >
      {playing ? '🔊 播放中…' : error ? '⚠️ 播放失敗' : '▶ 播放'}
    </button>
  )
}

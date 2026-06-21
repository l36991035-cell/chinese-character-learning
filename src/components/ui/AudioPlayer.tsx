'use client'
import { useState, useRef } from 'react'

export function AudioPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const playingRef = useRef(false)

  async function handlePlay() {
    if (playingRef.current) return
    playingRef.current = true
    setPlaying(true)
    setError(false)
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`)
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => {
        playingRef.current = false
        setPlaying(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        playingRef.current = false
        setPlaying(false)
        setError(true)
      }
      await audio.play()
    } catch {
      playingRef.current = false
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

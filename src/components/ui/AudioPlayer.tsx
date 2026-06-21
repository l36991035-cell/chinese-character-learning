'use client'
import { useState, useRef } from 'react'

export function AudioPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const playingRef = useRef(false)

  function handlePlay() {
    if (playingRef.current) return
    if (!('speechSynthesis' in window)) {
      setError(true)
      return
    }

    playingRef.current = true
    setPlaying(true)
    setError(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-TW'
    utterance.rate = 0.85

    utterance.onend = () => {
      playingRef.current = false
      setPlaying(false)
    }
    utterance.onerror = () => {
      playingRef.current = false
      setPlaying(false)
      setError(true)
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={handlePlay}
      disabled={playing}
      className="min-h-[64px] w-full flex items-center justify-center gap-3 text-xl font-medium rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors"
    >
      {playing ? '🔊 播放中…' : error ? '⚠️ 不支援語音' : '▶ 播放'}
    </button>
  )
}

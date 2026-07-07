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
      className="min-h-[56px] w-full flex items-center justify-center gap-2 text-xl font-semibold rounded-xl border border-gold text-[#8b7355] hover:bg-paper disabled:opacity-50 transition-colors"
    >
      {playing ? '🔊 播放中…' : error ? '⚠️ 不支援語音' : '🔊 聽讀音'}
    </button>
  )
}

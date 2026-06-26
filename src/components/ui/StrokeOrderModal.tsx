'use client'
import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'

interface Props {
  character: string
  onClose: () => void
}

export function StrokeOrderModal({ character, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    setLoadError(false)
    containerRef.current.innerHTML = ''
    const w = HanziWriter.create(containerRef.current, character, {
      width: 220,
      height: 220,
      padding: 10,
      showOutline: true,
      strokeColor: '#1d4ed8',
      outlineColor: '#d1d5db',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 400,
      onLoadCharDataSuccess: () => { writerRef.current?.loopCharacterAnimation() },
      onLoadCharDataError: () => { setLoadError(true) },
    })
    writerRef.current = w
    return () => { w.pauseAnimation() }
  }, [character])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl p-8 flex flex-col gap-6 items-center shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800">「{character}」的筆順</h2>
        {loadError ? (
          <p className="text-lg text-gray-500 py-8">這個字目前沒有筆順資料</p>
        ) : (
          <>
            <div ref={containerRef} />
            <p className="text-base text-gray-400">動畫會一直循環播放</p>
          </>
        )}
        <button
          onClick={onClose}
          className="min-h-[64px] w-full text-xl font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors px-8"
        >
          我知道了，繼續練習
        </button>
      </div>
    </div>
  )
}

'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

export function HandwritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      // Preserve drawing when resizing by saving/restoring image data
      const ctx = canvas.getContext('2d')
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = rect.width
      canvas.height = rect.height
      if (imageData) ctx?.putImageData(imageData, 0, 0)
    })
    observer.observe(canvas)
    // Initial size
    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0) {
      canvas.width = rect.width
      canvas.height = rect.height
    }
    return () => observer.disconnect()
  }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }, [])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getPos(e)
    setIsEmpty(false)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    isDrawing.current = false
    lastPos.current = null
  }

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white touch-none cursor-crosshair"
        style={{ height: '200px' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-300 text-2xl select-none">✏️ 在這裡寫字</p>
        </div>
      )}
      {!isEmpty && (
        <button
          onClick={clear}
          className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-sm"
        >
          清除
        </button>
      )}
    </div>
  )
}

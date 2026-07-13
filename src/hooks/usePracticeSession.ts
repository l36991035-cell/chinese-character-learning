'use client'
import { useState, useCallback } from 'react'
import type { PracticeItem } from '@/lib/utils/session-builder'

type SessionPhase = 'idle' | 'practicing' | 'revealing' | 'done'

interface PracticeSessionState {
  phase: SessionPhase
  items: PracticeItem[]
  currentIndex: number
  results: Array<{ item: PracticeItem; isCorrect: boolean }>
  sessionId: string
}

export function usePracticeSession() {
  const [state, setState] = useState<PracticeSessionState>({
    phase: 'idle',
    items: [],
    currentIndex: 0,
    results: [],
    sessionId: crypto.randomUUID(),
  })

  const startSession = useCallback((items: PracticeItem[]) => {
    setState({
      phase: items.length > 0 ? 'practicing' : 'done',
      items,
      currentIndex: 0,
      results: [],
      sessionId: crypto.randomUUID(),
    })
  }, [])

  const revealAnswer = useCallback(() => {
    setState((s) => ({ ...s, phase: 'revealing' }))
  }, [])

  const markResult = useCallback((isCorrect: boolean) => {
    setState((s) => {
      const result = { item: s.items[s.currentIndex], isCorrect }
      const results = [...s.results, result]
      const nextIndex = s.currentIndex + 1
      const done = nextIndex >= s.items.length
      return {
        ...s,
        results,
        currentIndex: nextIndex,
        phase: done ? 'done' : 'practicing',
      }
    })
  }, [])

  const jumpTo = useCallback((index: number) => {
    setState((s) => ({ ...s, currentIndex: index, phase: 'practicing' }))
  }, [])

  return {
    phase: state.phase,
    items: state.items,
    currentItem: state.items[state.currentIndex] ?? null,
    currentIndex: state.currentIndex,
    totalItems: state.items.length,
    results: state.results,
    sessionId: state.sessionId,
    startSession,
    revealAnswer,
    markResult,
    jumpTo,
  }
}

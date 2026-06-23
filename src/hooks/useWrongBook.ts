import { useEffect, useState } from 'react'
import { getWrongBook } from '@/lib/db/wrongbook'
import type { WrongBookEntry } from '@/types'

export function useWrongBook(studentId: number) {
  const [items, setItems] = useState<Array<WrongBookEntry & { id: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    getWrongBook(studentId).then((entries) => {
      setItems(entries as Array<WrongBookEntry & { id: number }>)
      setLoading(false)
    })
  }, [studentId])

  return { items, loading }
}

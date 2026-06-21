import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { WrongBookEntry } from '@/types'

export function useWrongBook(studentId: string) {
  const [items, setItems] = useState<Array<WrongBookEntry & { id: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    const q = query(
      collection(db, 'students', studentId, 'wrongbook'),
      orderBy('addedAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as WrongBookEntry) })))
      setLoading(false)
    })
    return unsub
  }, [studentId])

  return { items, loading }
}

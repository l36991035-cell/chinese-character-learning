import type { WrongBookEntry } from '@/types'
import { Timestamp } from 'firebase/firestore'

function formatDate(ts: Timestamp | null): string {
  if (!ts) return '—'
  return ts.toDate().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

export function WrongBookList({ items }: { items: Array<WrongBookEntry & { id: string }> }) {
  if (items.length === 0) {
    return <p className="text-lg text-gray-400">錯字本目前是空的</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-red-500 w-12 text-center">{item.character}</span>
            <div>
              <p className="text-base font-medium text-gray-700">錯誤 {item.wrongCount} 次</p>
              <p className="text-sm text-gray-400">加入：{formatDate(item.addedAt)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

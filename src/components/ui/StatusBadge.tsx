import type { CourseStatus } from '@/types'

const STATUS_LABELS: Record<CourseStatus, string> = {
  uploading: '上傳中',
  parsing: '解析中',
  ai_generating: 'AI 生成中',
  ready: '就緒',
  error: '錯誤',
}

const STATUS_COLORS: Record<CourseStatus, string> = {
  uploading: 'bg-gray-100 text-gray-600',
  parsing: 'bg-yellow-100 text-yellow-700',
  ai_generating: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-base font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

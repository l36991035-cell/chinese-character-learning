export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
}

export function StudentCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-6 w-16 mb-6" />
      <div className="flex gap-6 mb-6">
        <div className="text-center"><Skeleton className="h-9 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16" /></div>
        <div className="text-center"><Skeleton className="h-9 w-12 mx-auto mb-1" /><Skeleton className="h-4 w-16" /></div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-16" />
        <Skeleton className="w-24 h-16" />
      </div>
    </div>
  )
}

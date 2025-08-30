import { Skeleton } from '@/components/ui/skeleton'

interface StreamSkeletonProps {
  variant?: 'card' | 'page' | 'sidebar'
  className?: string
}

export default function StreamSkeleton({ variant = 'card', className = '' }: StreamSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
        <div className="aspect-video bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="aspect-video bg-muted rounded-2xl">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div className={`w-full lg:w-80 space-y-6 ${className}`}>
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  return null
}

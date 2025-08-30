'use client'

import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse skeleton', className)} />
}

// Profile-specific skeletons
export function ProfileHeaderSkeleton() {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border bg-surface shadow-soft">
      <div className="h-28 w-full skeleton" />
      <div className="flex items-end justify-between gap-4 px-4 pb-4">
        <div className="-mt-10 flex items-end gap-4">
          <div className="h-20 w-20 skeleton rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-32 skeleton rounded" />
            <div className="h-4 w-24 skeleton rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 skeleton rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-3/4 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

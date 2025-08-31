'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function SidebarSkeleton() {
  return (
    <div className="w-full lg:w-[360px] xl:w-[400px] space-y-4">
      {/* Creator Card Skeleton */}
      <div className="bg-surface border border-border/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Live Stats Skeleton */}
      <div className="bg-surface border border-border/40 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-6 w-16 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-surface border border-border/40 rounded-2xl">
        <div className="p-1">
          <div className="flex">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 flex-1 mx-1 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Row Skeleton */}
      <div className="bg-surface border border-border/40 rounded-2xl p-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'
import { getMockStreams } from '@/lib/streams.mock'
import StreamCard from '@/components/streams/StreamCard'
import { Skeleton } from '@/components/ui/skeleton'

function StreamsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <StreamsList />
    </div>
  )
}

async function StreamsList() {
  const streams = await getMockStreams()

  return (
    <>
      {streams.map((stream) => (
        <StreamCard key={stream.id} stream={stream} />
      ))}
    </>
  )
}

function StreamsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video rounded-xl" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StreamsPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Live Streams</h1>
        <p className="text-muted-foreground">Discover and watch live content from creators</p>
      </div>

      <Suspense fallback={<StreamsSkeleton />}>
        <StreamsGrid />
      </Suspense>
    </div>
  )
}

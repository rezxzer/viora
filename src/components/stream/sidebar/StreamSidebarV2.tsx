'use client'

import { useStreamRealtime } from '@/hooks/useStreamRealtime'
// Remove toast imports - using sonner instead
import CreatorCard from './CreatorCard'
import LiveStats from './LiveStats'
import SidebarTabs from './SidebarTabs'
import ActionsRow from './ActionsRow'
import SidebarSkeleton from './SidebarSkeleton'
import type { StreamStatus } from '@/types/streams'

interface StreamSidebarV2Props {
  stream: {
    id: string
    title: string
    status: StreamStatus
    creator_id: string
    created_at: string
    started_at?: string | null
    ended_at?: string | null
    visibility?: string
    description?: string
    viewers_count?: number
  }
  creatorProfile?: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
    bio?: string
  } | null
  session?: {
    hls_url?: string
    recording_url?: string
    thumbnail_url?: string
  } | null
}

export default function StreamSidebarV2({ stream, creatorProfile, session }: StreamSidebarV2Props) {
  // No toast hook needed - using sonner

  // Realtime subscription for status and viewers
  const { streamData } = useStreamRealtime(stream.id)

  // Use realtime data if available, fallback to props
  const currentStatus = streamData?.status || stream.status
  const currentViewers = streamData?.viewers_count || stream.viewers_count || 0

  // Show skeleton if creator profile is not loaded
  if (!creatorProfile) {
    return <SidebarSkeleton />
  }

  return (
    <>
      <aside className="w-full lg:w-[360px] xl:w-[400px] shrink-0 space-y-4">
        <CreatorCard
          creator={creatorProfile}
          streamStatus={currentStatus}
          streamTitle={stream.title}
        />

        <LiveStats
          viewers={currentViewers}
          status={currentStatus}
          startedAt={stream.started_at}
          createdAt={stream.created_at}
        />

        <SidebarTabs
          stream={{
            ...stream,
            status: currentStatus,
            viewers: currentViewers,
          }}
          session={session}
        />

        <ActionsRow streamId={stream.id} streamTitle={stream.title} />
      </aside>

      {/* Toast Container - using sonner instead */}
    </>
  )
}

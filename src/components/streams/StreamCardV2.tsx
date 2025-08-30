import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'
import LiveBadge from './LiveBadge'
import ViewersCount from './ViewersCount'
import StreamStatusBadge from './StreamStatusBadge'

interface StreamCardV2Props {
  stream: {
    id: string
    title: string
    status: string
    creator_id: string
    started_at?: string | null
    created_at: string
    stream_sessions: Array<{
      id: string
      hls_url?: string
      recording_url?: string
    }>
    viewers_count: number
  }
  creator: {
    id: string
    username: string
    avatar_url?: string
  }
}

export default function StreamCardV2({ stream, creator }: StreamCardV2Props) {
  const isLive = stream.status === 'live'
  const hasThumbnail = false // TODO: Add thumbnail support when available

  return (
    <Link
      href={`/stream/${stream.id}`}
      className="group block bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-video bg-muted">
        {hasThumbnail ? (
          <img src={hasThumbnail} alt={stream.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <div className="w-24 h-24 bg-muted rounded-xl opacity-50 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No thumbnail</span>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <StreamStatusBadge status={stream.status as 'idle' | 'active' | 'ended'} />
        </div>

        {/* Viewers Count */}
        <div className="absolute bottom-3 right-3">
          <ViewersCount count={stream.viewers_count || 0} />
        </div>

        {/* Live Glow Effect */}
        {isLive && (
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <UserAvatar
            src={creator.avatar_url}
            alt={creator.username}
            fallback={creator.username}
            className="w-10 h-10"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {stream.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">@{creator.username}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

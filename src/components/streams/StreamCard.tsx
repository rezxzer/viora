import Link from 'next/link'
import { UserAvatar } from '@/components/ui/UserAvatar'
import LiveBadge from './LiveBadge'
import ViewersCount from './ViewersCount'
import { MockStream } from '@/lib/streams.mock'

interface StreamCardProps {
  stream: MockStream
}

export default function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link
      href={`/stream/${stream.id}`}
      className="group block bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
    >
      <div className="relative aspect-video bg-muted">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <img
              src="/stream-placeholder.svg"
              alt="Stream placeholder"
              className="w-24 h-24 opacity-50"
            />
          </div>
        )}

        {stream.live && (
          <div className="absolute top-2 left-2">
            <LiveBadge />
          </div>
        )}

        <div className="absolute bottom-2 right-2">
          <ViewersCount count={stream.viewers} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <UserAvatar
            src={stream.creator.avatarUrl}
            alt={stream.creator.username}
            fallback={stream.creator.username}
            className="w-10 h-10"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {stream.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">@{stream.creator.username}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

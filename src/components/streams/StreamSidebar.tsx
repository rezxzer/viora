import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import LiveBadge from './LiveBadge'
import ViewersCount from './ViewersCount'

import { Heart, Share2, UserPlus, ThumbsUp, ThumbsDown } from 'lucide-react'

interface StreamSidebarProps {
  stream: {
    id: string
    title: string
    status: string
    creator: {
      id: string
      username: string
      avatarUrl?: string
    }
    viewers?: number
  }
  session?: {
    hls_url?: string
    rtmp_key?: string
    ingest_url?: string
  } | null
}

export default function StreamSidebar({ stream }: StreamSidebarProps) {
  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Stream Info */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <UserAvatar
            src={stream.creator.avatarUrl}
            alt={stream.creator.username}
            fallback={stream.creator.username}
            className="w-12 h-12"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground line-clamp-2">{stream.title}</h1>
            <p className="text-muted-foreground mt-1">@{stream.creator.username}</p>
            <div className="flex items-center gap-2 mt-2">
              {stream.status === 'live' && <LiveBadge />}
              <ViewersCount count={stream.viewers || 0} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <UserPlus className="w-4 h-4 mr-2" />
            Follow
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-border">
          <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
            About
          </button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Reactions
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Stream description and details will appear here.</p>
        </div>
      </div>

      {/* Action Row */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <ThumbsUp className="w-4 h-4 mr-2" />
            Like
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <ThumbsDown className="w-4 h-4 mr-2" />
            Dislike
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Heart className="w-4 h-4 mr-2" />
            Tip
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'

import { Share2, Flag, Gift } from 'lucide-react'
import { toast } from 'sonner'
import type { StreamStatus } from '@/types/streams'

interface CreatorCardProps {
  creator: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
    bio?: string
  }
  streamStatus: StreamStatus
  streamTitle: string
}

export default function CreatorCard({ creator, streamStatus }: CreatorCardProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  // toast function imported from sonner

  const handleFollow = () => {
    // TODO: Implement follow API call
    setIsFollowing(!isFollowing)
    toast.info('Follow functionality will be available soon')
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      toast.success('Link copied to clipboard')
    }
  }

  const handleReport = () => {
    toast.info('Report functionality will be available soon')
  }

  const handleTip = () => {
    toast.info('Tip functionality will be available soon')
  }

  const getStatusText = () => {
    switch (streamStatus) {
      case 'active':
        return 'Live now'
      case 'ended':
        return '• Offline'
      default:
        return '• Idle'
    }
  }

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'active':
        return 'bg-red-500'
      default:
        return 'bg-muted-foreground'
    }
  }

  return (
    <div className="bg-surface border border-border/40 rounded-2xl p-4 space-y-3">
      {/* Creator Info */}
      <div className="flex items-start gap-3">
        <UserAvatar
          src={creator.avatar_url}
          alt={creator.full_name || creator.username}
          fallback={creator.full_name || creator.username}
          className="w-12 h-12 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {creator.full_name || creator.username}
          </h3>
          <p className="text-sm text-muted-foreground">@{creator.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex gap-2">
        <Button
          onClick={handleFollow}
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          className="flex-1"
          aria-label={isFollowing ? 'Unfollow creator' : 'Follow creator'}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>

        <Button onClick={handleShare} variant="outline" size="sm" aria-label="Share stream">
          <Share2 className="w-4 h-4" />
        </Button>

        <Button onClick={handleReport} variant="outline" size="sm" aria-label="Report stream">
          <Flag className="w-4 h-4" />
        </Button>

        <Button onClick={handleTip} variant="outline" size="sm" aria-label="Tip creator">
          <Gift className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

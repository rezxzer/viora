'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, UserPlus, Gift } from 'lucide-react'
import { toast } from 'sonner'

interface ActionsRowProps {
  streamId: string
  streamTitle: string
}

export default function ActionsRow({}: ActionsRowProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  // toast function imported from sonner

  const handleFollow = () => {
    // TODO: Implement follow API call
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? 'Unfollowed' : 'Following')
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

  const handleTip = () => {
    toast.info('Tip functionality will be available soon')
  }

  return (
    <div className="bg-surface border border-border/40 rounded-2xl p-4 space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          variant="secondary"
          size="sm"
          className="flex-1"
          aria-label="Share stream"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button
          onClick={handleFollow}
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          className="flex-1"
          aria-label={isFollowing ? 'Unfollow creator' : 'Follow creator'}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isFollowing ? 'Following' : 'Follow'}
        </Button>

        <Button
          onClick={handleTip}
          variant="outline"
          size="sm"
          className="flex-1"
          aria-label="Tip creator"
        >
          <Gift className="w-4 h-4 mr-2" />
          Tip
        </Button>
      </div>
    </div>
  )
}

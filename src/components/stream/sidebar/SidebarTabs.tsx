'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// ScrollArea component exists but using div with overflow instead
import { Button } from '@/components/ui/button'
import {
  Heart,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Gift,
  Clock,
  Eye,
  Calendar,
} from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

interface SidebarTabsProps {
  stream: {
    id: string
    title: string
    status: StreamStatus
    created_at: string
    started_at?: string | null
    ended_at?: string | null
    visibility?: string
    description?: string
    viewers?: number
  }
  session?: {
    recording_url?: string
    thumbnail_url?: string
  } | null
}

export default function SidebarTabs({ stream, session }: SidebarTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('about')
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)

  // Sync with URL params
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['about', 'reactions', 'chat'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams)
    params.set('tab', value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleLike = () => {
    setLikeCount((prev) => prev + 1)
    // TODO: Implement like API call
  }

  const handleDislike = () => {
    setDislikeCount((prev) => prev + 1)
    // TODO: Implement dislike API call
  }

  const handleTip = () => {
    // TODO: Implement tip functionality
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getVisibilityIcon = () => {
    switch (stream.visibility) {
      case 'public':
        return <Eye className="w-4 h-4" />
      case 'subscribers':
        return <Heart className="w-4 h-4" />
      case 'private':
        return <Clock className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  const getVisibilityText = () => {
    switch (stream.visibility) {
      case 'public':
        return 'Public'
      case 'subscribers':
        return 'Subscribers only'
      case 'private':
        return 'Private'
      default:
        return 'Public'
    }
  }

  return (
    <div className="bg-surface border border-border/40 rounded-2xl">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-t-2xl rounded-b-none">
          <TabsTrigger value="about" className="rounded-tl-2xl">
            About
          </TabsTrigger>
          <TabsTrigger value="reactions">Reactions</TabsTrigger>
          <TabsTrigger value="chat" className="rounded-tr-2xl">
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">About this stream</h3>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {stream.description || `${stream.title} is a live stream.`}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(stream.created_at)}</span>
              </div>

              {stream.started_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">{formatDate(stream.started_at)}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {getVisibilityIcon()}
                <span className="text-muted-foreground">Visibility:</span>
                <span className="font-medium">{getVisibilityText()}</span>
              </div>
            </div>

            {stream.status === 'ended' && session?.recording_url && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground">Watch the recording when available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reactions" className="p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Reactions</h3>

            <div className="flex gap-2">
              <Button
                onClick={handleLike}
                variant="outline"
                size="sm"
                className="flex-1"
                aria-label="Like stream"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                {likeCount}
              </Button>
              <Button
                onClick={handleDislike}
                variant="outline"
                size="sm"
                className="flex-1"
                aria-label="Dislike stream"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                {dislikeCount}
              </Button>
            </div>

            <Button
              onClick={handleTip}
              variant="outline"
              size="sm"
              className="w-full"
              aria-label="Tip creator"
            >
              <Gift className="w-4 h-4 mr-2" />
              Tip Creator
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="p-4">
          <div className="h-64 overflow-auto">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Live Chat</h3>

              <div className="text-center py-16 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chat is coming soon</p>
                <p className="text-xs mt-1">Stay tuned for live chat functionality</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

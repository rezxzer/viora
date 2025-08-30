'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import LiveBadge from './LiveBadge'
import ViewersCount from './ViewersCount'
import {
  Heart,
  Share2,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Gift,
  Settings,
} from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

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
    started_at?: string
    created_at?: string
  }
  session?: {
    hls_url?: string
    rtmp_key?: string
    ingest_url?: string
  } | null
}

export default function StreamSidebar({ stream }: StreamSidebarProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'reactions' | 'chat'>('about')
  const [isFollowing, setIsFollowing] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [tipAmount, setTipAmount] = useState(0)

  // Add null check for creator
  if (!stream.creator) {
    return (
      <div className="w-full lg:w-80 space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <p>Stream creator information not available</p>
        </div>
      </div>
    )
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // TODO: Implement follow API call
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
    const amount = prompt('Enter tip amount (in coins):', '10')
    if (amount && !isNaN(Number(amount))) {
      setTipAmount((prev) => prev + Number(amount))
      // TODO: Implement tip API call
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/stream/${stream.id}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Stream URL copied to clipboard!')
    })
  }

  const tabs = [
    { id: 'about', label: 'About', icon: null },
    { id: 'reactions', label: 'Reactions', icon: Heart },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ]

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Creator Info Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
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

        <div className="flex gap-2">
          <Button
            onClick={handleFollow}
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            className="flex-1"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-surface border border-border rounded-2xl p-1">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'about' | 'reactions' | 'chat')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <h3 className="font-semibold">About this stream</h3>
            <p className="text-sm text-muted-foreground">
              {stream.title} is a live stream by @{stream.creator.username}.
              {stream.started_at && (
                <span className="block mt-2">
                  Started: {new Date(stream.started_at).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        )}

        {activeTab === 'reactions' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Reactions</h3>
            <div className="flex gap-2">
              <Button onClick={handleLike} variant="outline" size="sm" className="flex-1">
                <ThumbsUp className="w-4 h-4 mr-2" />
                {likeCount}
              </Button>
              <Button onClick={handleDislike} variant="outline" size="sm" className="flex-1">
                <ThumbsDown className="w-4 h-4 mr-2" />
                {dislikeCount}
              </Button>
            </div>
            <Button onClick={handleTip} variant="outline" size="sm" className="w-full">
              <Gift className="w-4 h-4 mr-2" />
              Tip Creator
            </Button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Live Chat</h3>
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chat coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

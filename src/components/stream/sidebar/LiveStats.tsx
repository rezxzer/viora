'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

interface LiveStatsProps {
  viewers: number
  status: StreamStatus
  startedAt?: string | null
  createdAt: string
}

export default function LiveStats({ viewers, status, startedAt, createdAt }: LiveStatsProps) {
  const [duration, setDuration] = useState<string>('')

  // Calculate and update duration when stream is live
  useEffect(() => {
    if (status === 'active' && startedAt) {
      const updateDuration = () => {
        const startTime = new Date(startedAt).getTime()
        const now = Date.now()
        const diff = now - startTime

        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setDuration(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          )
        }
      }

      updateDuration()
      const interval = setInterval(updateDuration, 1000)
      return () => clearInterval(interval)
    }
  }, [status, startedAt])

  const getStatusBadge = () => {
    const variants = {
      active: 'bg-red-500 hover:bg-red-600 text-white',
      idle: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      ended: 'bg-gray-500 hover:bg-gray-600 text-white',
      errored: 'bg-red-600 hover:bg-red-700 text-white',
      disabled: 'bg-gray-400 hover:bg-gray-500 text-white',
      recording: 'bg-blue-500 hover:bg-blue-600 text-white',
      processing: 'bg-purple-500 hover:bg-purple-600 text-white',
    }

    const labels = {
      active: 'Live',
      idle: 'Idle',
      ended: 'Ended',
      errored: 'Error',
      disabled: 'Disabled',
      recording: 'Recording',
      processing: 'Processing',
    }

    return (
      <Badge className={variants[status] || 'bg-gray-500 hover:bg-gray-600 text-white'}>
        {labels[status] || 'Unknown'}
      </Badge>
    )
  }

  const getStartedTime = () => {
    if (startedAt) {
      return new Date(startedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return new Date(createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-surface border border-border/40 rounded-2xl p-4 space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Viewers */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Viewers</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{viewers}</div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="mb-1">{getStatusBadge()}</div>
          <div className="text-xs text-muted-foreground">Status</div>
        </div>
      </div>

      {/* Time Info */}
      <div className="space-y-2">
        {status === 'active' && startedAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Started</span>
            <span className="font-medium">{getStartedTime()}</span>
          </div>
        )}

        {status === 'active' && duration && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium font-mono">{duration}</span>
          </div>
        )}

        {status !== 'active' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">{getStartedTime()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

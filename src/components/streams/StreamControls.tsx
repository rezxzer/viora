'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Play,
  Square,
  Loader2,
  Settings,
  Video,
  AlertTriangle,
  Edit,
  Key,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import CopyButton from './CopyButton'
import type { StreamStatus } from '@/types/streams'

interface StreamControlsProps {
  streamId: string
  currentStatus: StreamStatus
  onStatusChange: (newStatus: StreamStatus) => void
  streamData?: {
    title?: string
    description?: string
    mux_stream_key?: string
    playback_url?: string
  }
  rtmpData?: {
    // Added: RTMP data from API
    server: string
    stream_key: string | null
  } | null
  onDataUpdate?: (data: { title?: string; description?: string }) => void
  className?: string
}

export default function StreamControls({
  streamId,
  currentStatus,
  onStatusChange,
  streamData,
  rtmpData, // Added: RTMP data prop
  onDataUpdate,
  className = '',
}: StreamControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editMode, setEditMode] = useState<'title' | 'description' | null>(null)
  const [editTitle, setEditTitle] = useState(streamData?.title || '')
  const [editDescription, setEditDescription] = useState(streamData?.description || '')

  const handleStartStream = async () => {
    if (currentStatus === 'active') return

    setIsUpdating(true)
    try {
      await onStatusChange('active')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStopStream = async () => {
    if (currentStatus !== 'active') return

    setIsUpdating(true)
    try {
      await onStatusChange('ended')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      // Force a status refresh by calling the API
      const response = await fetch(`/api/streams/${streamId}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        // If the API returns updated status, trigger a refresh
        if (data.status && data.status !== currentStatus) {
          await onStatusChange(data.status)
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editMode) return

    try {
      const updateData =
        editMode === 'title' ? { title: editTitle.trim() } : { description: editDescription.trim() }

      const response = await fetch(`/api/streams/${streamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        onDataUpdate?.(updateData)
        setEditMode(null)
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Failed to save edit:', error)
      alert('Failed to save changes')
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    setEditTitle(streamData?.title || '')
    setEditDescription(streamData?.description || '')
  }

  const getButtonConfig = () => {
    switch (currentStatus) {
      case 'idle':
        return {
          text: 'Go Live',
          icon: <Play className="w-4 h-4 mr-2" />,
          variant: 'default' as const,
          onClick: handleStartStream,
          disabled: isUpdating,
          className: 'bg-green-600 hover:bg-green-700',
        }
      case 'active':
        return {
          text: 'End Stream',
          icon: <Square className="w-4 h-4 mr-2" />,
          variant: 'destructive' as const,
          onClick: handleStopStream,
          disabled: isUpdating,
        }
      case 'ended':
        return {
          text: 'Stream Ended',
          icon: <Square className="w-4 h-4 mr-2" />,
          variant: 'secondary' as const,
          onClick: () => {},
          disabled: true,
        }
      case 'recording':
        return {
          text: 'Recording Ready',
          icon: <Video className="w-4 h-4 mr-2" />,
          variant: 'secondary' as const,
          onClick: () => {},
          disabled: true,
        }
      case 'processing':
        return {
          text: 'Processing...',
          icon: <Loader2 className="w-4 h-4 mr-2 animate-spin" />,
          variant: 'secondary' as const,
          onClick: () => {},
          disabled: true,
        }
      case 'errored':
        return {
          text: 'Stream Error',
          icon: <AlertTriangle className="w-4 h-4 mr-2" />,
          variant: 'destructive' as const,
          onClick: () => {},
          disabled: true,
        }
      case 'disabled':
        return {
          text: 'Stream Disabled',
          icon: <AlertTriangle className="w-4 h-4 mr-2" />,
          variant: 'secondary' as const,
          onClick: () => {},
          disabled: true,
        }
      default:
        return {
          text: 'Unknown Status',
          icon: <Play className="w-4 h-4 mr-2" />,
          variant: 'outline' as const,
          onClick: () => {},
          disabled: true,
        }
    }
  }

  const config = getButtonConfig()

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main Controls Row */}
        <div className="flex items-center gap-3">
          <Button
            onClick={config.onClick}
            variant={config.variant}
            disabled={config.disabled}
            className={`flex-1 ${config.className || ''}`}
            size="lg"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentStatus === 'idle' ? 'Starting...' : 'Stopping...'}
              </>
            ) : (
              <>
                {config.icon}
                {config.text}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="px-3"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {currentStatus === 'idle' && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setEditMode('title')}
              className="px-3"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stream Info & Edit Controls */}
        <div className="space-y-3">
          {/* Title Edit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Title</label>
              {editMode !== 'title' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditMode('title')
                    setEditTitle(streamData?.title || '')
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>
            {editMode === 'title' ? (
              <div className="flex gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Stream title..."
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                {streamData?.title || 'No title set'}
              </p>
            )}
          </div>

          {/* Description Edit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              {editMode !== 'description' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditMode('description')
                    setEditDescription(streamData?.description || '')
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>
            {editMode === 'description' ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Stream description..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded min-h-[60px]">
                {streamData?.description || 'No description set'}
              </p>
            )}
          </div>
        </div>

        {/* RTMP Fields - Owner Only */}
        {rtmpData?.stream_key && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              RTMP Settings
            </h4>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">RTMP Server</label>
              <div className="flex gap-2">
                <Input readOnly value={rtmpData.server} className="font-mono text-xs" />
                <CopyButton value={rtmpData.server} label="Copy" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Stream Key</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={rtmpData.stream_key}
                  type="password"
                  className="font-mono text-xs"
                />
                <CopyButton value={rtmpData.stream_key!} label="Copy" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Use these in OBS → Settings → Stream (Service: Custom).
            </p>
          </div>
        )}

        {/* Copy Controls */}
        {(streamData?.mux_stream_key || streamData?.playback_url) && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              Stream Details
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {streamData?.mux_stream_key && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[80px]">Stream Key:</span>
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={streamData.mux_stream_key}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <CopyButton value={streamData.mux_stream_key} label="Copy" />
                  </div>
                </div>
              )}

              {streamData?.playback_url && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[80px]">Playback URL:</span>
                  <div className="flex-1 flex gap-2">
                    <Input value={streamData.playback_url} readOnly className="font-mono text-xs" />
                    <CopyButton value={streamData.playback_url} label="Copy" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(streamData.playback_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Display */}
        <div className="text-sm text-muted-foreground">
          <p>
            Current Status: <span className="font-medium uppercase">{currentStatus}</span>
          </p>
          {currentStatus === 'idle' && (
            <p>Click &quot;Go Live&quot; to start broadcasting your stream</p>
          )}
          {currentStatus === 'active' && <p>Your stream is now live! Viewers can watch you.</p>}
          {currentStatus === 'ended' && (
            <p>This stream has ended. You can start a new one anytime.</p>
          )}
          {currentStatus === 'recording' && <p>Recording is ready and available for playback.</p>}
          {currentStatus === 'processing' && <p>Stream is being processed for VOD playback.</p>}
          {currentStatus === 'errored' && <p>Something went wrong with this stream.</p>}
          {currentStatus === 'disabled' && <p>This stream has been disabled.</p>}
        </div>
      </div>
    </>
  )
}

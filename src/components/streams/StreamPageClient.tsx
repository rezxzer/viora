'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StreamSidebarV2 } from '../stream/sidebar'
import StreamControls from './StreamControls'
import type { StreamStatus } from '@/types/streams'
import CameraControls from './CameraControls'

interface StreamPageClientProps {
  stream: {
    id: string
    title: string
    status: string
    creator: { id: string; username: string; avatarUrl?: string }
    viewers?: number
    started_at?: string
    created_at: string
  }
  session?: {
    id: string
    stream_id: string
    provider: string
    hls_url?: string
    rtmp_key?: string
    ingest_url?: string
    created_at: string
  } | null
}

export default function StreamPageClient({ stream, session }: StreamPageClientProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<StreamStatus>(stream.status as StreamStatus)

  const handleStatusChange = async (newStatus: StreamStatus) => {
    try {
      const response = await fetch('/api/streams/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stream.id,
          status: newStatus,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = data?.error || `Failed to update status: ${response.status}`
        throw new Error(errorMessage)
      }

      // Update local state
      setCurrentStatus(newStatus)

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status'
      console.error('Error updating stream status:', error)
      alert(`Error: ${errorMessage}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden">
            {currentStatus === 'active' ? (
              <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-green-500/40 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                      🎥 Live Stream
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-300">
                      Your stream is currently live
                    </div>
                  </div>
                </div>
              </div>
            ) : currentStatus === 'ended' ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-500/10 to-gray-500/5 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-500/40 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-400">
                      📺 Stream Ended
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Your stream has finished
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-yellow-500/40 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                      ⏸️ Stream Idle
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-300">
                      Ready to start streaming
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stream Controls */}
          <StreamControls
            streamId={stream.id}
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
            className="bg-surface border border-border rounded-xl p-4"
          />

          {/* Camera Controls - Only show when stream is live */}
          {currentStatus === 'active' && (
            <CameraControls
              streamId={stream.id}
              currentStatus={currentStatus}
              onStatusChange={handleStatusChange}
              className="bg-surface border border-border rounded-xl p-4"
            />
          )}

          {/* Mobile Stream Info */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Avatar</span>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{stream.title}</h1>
                <p className="text-muted-foreground">Status: {currentStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:block">
          <StreamSidebarV2
            stream={{
              ...stream,
              status: currentStatus,
              creator_id: stream.creator.id,
              viewers_count: stream.viewers || 0,
            }}
            session={session}
          />
        </div>
      </div>
    </div>
  )
}

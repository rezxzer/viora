'use client'

import { Button } from '@/components/ui/button'
import { Play, Users, Clock, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function CreatorStreamsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [createdStream, setCreatedStream] = useState<{
    stream: { id: string; title: string; status: string; created_at: string }
    session: { rtmp_key?: string; ingest_url?: string } | null
  } | null>(null)
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({})

  const handleCreateStream = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/streams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Stream', visibility: 'public' }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedStream(data)
      } else {
        console.error('Failed to create stream')
      }
    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStates((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setCopyStates((prev) => ({ ...prev, [key]: false })), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleStatusToggle = async (streamId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'idle' ? 'live' : 'ended'
    try {
      const response = await fetch('/api/streams/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, status: newStatus }),
      })

      if (response.ok) {
        // Refresh the created stream data
        const updatedStream = await response.json()
        setCreatedStream((prev) => (prev ? { ...prev, stream: updatedStream.stream } : null))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-muted-foreground">Manage your streams and content</p>
      </div>

      {/* Start Stream Section */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Start a New Stream</h2>
            <p className="text-muted-foreground">Go live and connect with your audience</p>
          </div>
        </div>

        <Button onClick={handleCreateStream} disabled={isCreating} className="w-full sm:w-auto">
          <Play className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'Create Stream'}
        </Button>
      </div>

      {/* Created Stream Section */}
      {createdStream && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Current Stream</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{createdStream.stream.title}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {createdStream.stream.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleStatusToggle(createdStream.stream.id, createdStream.stream.status)
                  }
                  variant="outline"
                  size="sm"
                >
                  {createdStream.stream.status === 'idle' ? 'Go Live' : 'End Stream'}
                </Button>
              </div>
            </div>

            {/* Stream Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Stream Info</p>
                <div className="space-y-1">
                  <p>ID: {createdStream.stream.id}</p>
                  <p>Created: {new Date(createdStream.stream.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Connection Details</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">RTMP Key:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {createdStream.session?.rtmp_key || 'Not set'}
                    </span>
                    {createdStream.session?.rtmp_key && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(createdStream.session!.rtmp_key!, 'rtmp')}
                      >
                        {copyStates.rtmp ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ingest URL:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {createdStream.session?.ingest_url || 'Not set'}
                    </span>
                    {createdStream.session?.ingest_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(createdStream.session!.ingest_url!, 'ingest')}
                      >
                        {copyStates.ingest ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Streams Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Past Streams</h2>
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm">Your stream history will appear here</p>
        </div>
      </div>

      {/* Development Tools */}
      {process.env.NODE_ENV === 'development' && createdStream && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3">
          <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
            Development Tools
          </h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-300">
            Debug controls for testing stream status changes
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                handleStatusToggle(createdStream.stream.id, createdStream.stream.status)
              }
              variant="outline"
              size="sm"
              className="border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
            >
              Toggle Status (Debug)
            </Button>
          </div>
        </div>
      )}

      {/* Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Total Streams</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground">Total Viewers</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">0h</p>
          <p className="text-sm text-muted-foreground">Stream Time</p>
        </div>
      </div>
    </div>
  )
}

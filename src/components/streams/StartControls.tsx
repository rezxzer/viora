'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Play, Loader2, Radio } from 'lucide-react'
import type { CreateStreamResponse } from '@/types/streams'

interface StartControlsProps {
  onStreamCreated: (response: CreateStreamResponse) => void
  className?: string
}

export default function StartControls({ onStreamCreated, className = '' }: StartControlsProps) {
  const [title, setTitle] = useState('My Live Stream')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateStream = async () => {
    if (!title.trim()) {
      setError('Please enter a stream title')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/streams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          visibility: 'public',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = data?.error || `Failed to create stream: ${response.status}`
        throw new Error(errorMessage)
      }

      onStreamCreated(data)
      console.info('Stream created successfully:', data.stream.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stream'
      setError(errorMessage)
      console.error('Error creating stream:', err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Radio className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Create New Stream</h3>
          <p className="text-sm text-muted-foreground">Start broadcasting to your audience</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="stream-title" className="text-sm font-medium">
            Stream Title
          </label>
          <Input
            id="stream-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your stream title..."
            disabled={isCreating}
            className="font-medium"
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          onClick={handleCreateStream}
          disabled={isCreating || !title.trim()}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Stream...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Stream
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          This will create a new stream and provide you with RTMP details for broadcasting.
        </p>
      </div>
    </div>
  )
}

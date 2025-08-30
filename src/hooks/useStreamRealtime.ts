'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import type { StreamStatus } from '@/types/streams'

interface StreamRealtimeData {
  status: StreamStatus
  viewers_count: number
  mux_live_stream_id?: string
  mux_asset_id?: string
  last_error?: string
}

interface StreamUpdatePayload {
  new: {
    id: string
    status: StreamStatus
    viewers_count?: number
    mux_live_stream_id?: string
    mux_asset_id?: string
    last_error?: string
    [key: string]: unknown
  }
}

export function useStreamRealtime(streamId: string) {
  const [streamData, setStreamData] = useState<StreamRealtimeData | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!streamId) return

    const supabase = supabaseBrowserClient()

    // Subscribe to changes on the specific stream
    const channel = supabase
      .channel(`stream:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`,
        },
        (payload: StreamUpdatePayload) => {
          const newData = payload.new
          setStreamData({
            status: newData.status,
            viewers_count: newData.viewers_count || 0,
            mux_live_stream_id: newData.mux_live_stream_id as string | undefined,
            mux_asset_id: newData.mux_asset_id as string | undefined,
            last_error: newData.last_error as string | undefined,
          })
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true)
      })
      .on('presence', { event: 'join' }, () => {
        setIsConnected(true)
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [streamId])

  return { streamData, isConnected }
}

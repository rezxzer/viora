'use client'

import { useEffect, useRef, useState } from 'react'

interface UseViewerManagementProps {
  streamId: string
  onViewerCountUpdate?: (count: number) => void
}

export function useViewerManagement({ streamId, onViewerCountUpdate }: UseViewerManagementProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const viewerTokenRef = useRef<string | null>(null)

  // Get or create viewer token
  const getViewerToken = () => {
    if (viewerTokenRef.current) return viewerTokenRef.current

    const storageKey = `viora:viewer:${streamId}`
    let token = sessionStorage.getItem(storageKey)

    if (!token) {
      token = crypto.randomUUID()
      sessionStorage.setItem(storageKey, token)
    }

    viewerTokenRef.current = token
    return token
  }

  // Join stream
  const joinStream = async () => {
    if (isJoining) return

    setIsJoining(true)
    setError(null)

    try {
      const token = getViewerToken()
      const response = await fetch('/api/streams/viewers/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join stream')
      }

      onViewerCountUpdate?.(data.viewers)

      // Start heartbeat only after successful join
      setTimeout(() => {
        startHeartbeat()
      }, 1000) // Wait 1 second before starting heartbeat
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join stream'
      setError(errorMessage)
      console.error('Join stream error:', errorMessage)
    } finally {
      setIsJoining(false)
    }
  }

  // Leave stream
  const leaveStream = async () => {
    try {
      const token = getViewerToken()

      // Use sendBeacon for reliable delivery during page unload
      const blob = new Blob([JSON.stringify({ streamId, token })], { type: 'application/json' })

      navigator.sendBeacon('/api/streams/viewers/leave', blob)

      // Also try regular fetch as fallback
      await fetch('/api/streams/viewers/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, token }),
      })
    } catch (err) {
      console.error('Leave stream error:', err)
    }
  }

  // Start heartbeat
  const startHeartbeat = () => {
    if (heartbeatRef.current) return

    heartbeatRef.current = setInterval(async () => {
      try {
        const token = getViewerToken()
        await fetch('/api/streams/viewers/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId, token }),
        })
      } catch (err) {
        console.error('Heartbeat error:', err)
      }
    }, 30000) // 30 seconds instead of 25
  }

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat()
      // Don't call leaveStream here as it might cause issues during unmount
    }
  }, [streamId])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat()
      } else {
        // Only restart heartbeat if we were successfully joined
        if (viewerTokenRef.current) {
          startHeartbeat()
        }
      }
    }

    const handlePageHide = () => {
      leaveStream()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [streamId])

  return {
    joinStream,
    leaveStream,
    isJoining,
    error,
    retry: joinStream,
  }
}

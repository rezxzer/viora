'use client'

import { Button } from '@/components/ui/button'
import { Play, Square } from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

interface DevToggleProps {
  currentStatus: StreamStatus
  streamId: string
  onStatusChange: (newStatus: StreamStatus) => void
  isUpdating?: boolean
  className?: string
}

export default function DevToggle({
  currentStatus,
  streamId,
  onStatusChange,
  isUpdating = false,
  className = '',
}: DevToggleProps) {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const getNextStatus = (): StreamStatus => {
    switch (currentStatus) {
      case 'idle':
        return 'active'
      case 'active':
        return 'ended'
      case 'ended':
        return 'idle'
      default:
        return 'idle'
    }
  }

  const getButtonText = (): string => {
    switch (currentStatus) {
      case 'idle':
        return 'Go Live'
      case 'active':
        return 'End Stream'
      case 'ended':
        return 'Reset to Idle'
      default:
        return 'Go Live'
    }
  }

  const getButtonIcon = () => {
    switch (currentStatus) {
      case 'idle':
        return <Play className="w-4 h-4 mr-2" />
      case 'active':
        return <Square className="w-4 h-4 mr-2" />
      case 'ended':
        return <Play className="w-4 h-4 mr-2" />
      default:
        return <Play className="w-4 h-4 mr-2" />
    }
  }

  const getButtonVariant = (): 'default' | 'outline' | 'destructive' => {
    switch (currentStatus) {
      case 'idle':
        return 'default'
      case 'active':
        return 'destructive'
      case 'ended':
        return 'outline'
      default:
        return 'default'
    }
  }

  const handleToggle = () => {
    const newStatus = getNextStatus()
    onStatusChange(newStatus)
  }

  return (
    <div
      className={`bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3 ${className}`}
    >
      <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
        Development Tools
      </h3>
      <p className="text-sm text-yellow-600 dark:text-yellow-300">
        Debug controls for testing stream status changes
      </p>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleToggle}
          variant={getButtonVariant()}
          size="sm"
          disabled={isUpdating}
          className="border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
        >
          {getButtonIcon()}
          {isUpdating ? 'Updating...' : getButtonText()}
        </Button>

        <div className="text-sm text-yellow-600 dark:text-yellow-300">
          Current: <span className="font-medium">{currentStatus.toUpperCase()}</span>
        </div>
      </div>

      <div className="text-xs text-yellow-500/70">Stream ID: {streamId}</div>
    </div>
  )
}

import { Calendar, Clock } from 'lucide-react'
import StreamStatusBadge from './StreamStatusBadge'
import type { Stream } from '@/types/streams'

interface StreamInfoProps {
  stream: Stream
  className?: string
}

export default function StreamInfo({ stream, className = '' }: StreamInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = () => {
    if (stream.started_at && stream.ended_at) {
      const start = new Date(stream.started_at)
      const end = new Date(stream.ended_at)
      const diff = end.getTime() - start.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    }
    if (stream.started_at && stream.status === 'active') {
      const start = new Date(stream.started_at)
      const now = new Date()
      const diff = now.getTime() - start.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    }
    return 'Not started'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{stream.title}</h2>
          <div className="flex items-center gap-2">
            <StreamStatusBadge status={stream.status} />
            <span className="text-sm text-muted-foreground">ID: {stream.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Created</span>
          </div>
          <p className="font-medium">{formatDate(stream.created_at)}</p>
        </div>

        {stream.started_at && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Duration</span>
            </div>
            <p className="font-medium">{getDuration()}</p>
          </div>
        )}
      </div>

      {stream.status === 'active' && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            🎥 Stream is currently live
          </p>
          <p className="text-xs text-green-600 dark:text-green-300 mt-1">
            Viewers can now watch your stream
          </p>
        </div>
      )}

      {stream.status === 'ended' && (
        <div className="p-3 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground font-medium">📺 Stream has ended</p>
          <p className="text-xs text-muted-foreground mt-1">You can start a new stream anytime</p>
        </div>
      )}
    </div>
  )
}

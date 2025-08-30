import { Badge } from '@/components/ui/badge'
import { Play, Square, Clock, AlertCircle, X, Circle, Loader2, HelpCircle } from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

interface StreamStatusBadgeProps {
  status: StreamStatus
  className?: string
}

export default function StreamStatusBadge({ status, className = '' }: StreamStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: <Play className="w-3 h-3" />,
          variant: 'default' as const,
          text: 'LIVE',
          className: 'bg-green-500 hover:bg-green-600 text-white',
        }
      case 'idle':
        return {
          icon: <Clock className="w-3 h-3" />,
          variant: 'secondary' as const,
          text: 'IDLE',
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        }
      case 'ended':
        return {
          icon: <Square className="w-3 h-3" />,
          variant: 'outline' as const,
          text: 'ENDED',
          className: 'bg-gray-500 hover:bg-gray-600 text-white',
        }
      case 'errored':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          variant: 'destructive' as const,
          text: 'ERROR',
          className: 'bg-red-600 hover:bg-red-700 text-white',
        }
      case 'disabled':
        return {
          icon: <X className="w-3 h-3" />,
          variant: 'outline' as const,
          text: 'DISABLED',
          className: 'bg-gray-400 hover:bg-gray-500 text-white',
        }
      case 'recording':
        return {
          icon: <Circle className="w-3 h-3" />,
          variant: 'default' as const,
          text: 'RECORDING',
          className: 'bg-blue-500 hover:bg-blue-600 text-white',
        }
      case 'processing':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          variant: 'outline' as const,
          text: 'PROCESSING',
          className: 'bg-purple-500 hover:bg-purple-600 text-white',
        }
      default:
        return {
          icon: <HelpCircle className="w-3 h-3" />,
          variant: 'outline' as const,
          text: 'UNKNOWN',
          className: 'bg-gray-500 hover:bg-gray-600 text-white',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {config.icon}
      <span className="ml-1 font-medium">{config.text}</span>
    </Badge>
  )
}

import { Users } from 'lucide-react'

interface ViewersCountProps {
  count: number
  className?: string
}

export default function ViewersCount({ count, className = '' }: ViewersCountProps) {
  const formatCount = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
      <Users className="w-4 h-4" />
      <span>{formatCount(count)}</span>
    </div>
  )
}

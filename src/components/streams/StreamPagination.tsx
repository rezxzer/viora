import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface StreamPaginationProps {
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  isLoading?: boolean
  className?: string
}

export default function StreamPagination({
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  isLoading = false,
  className = '',
}: StreamPaginationProps) {
  if (!hasNext && !hasPrevious) return null

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!hasPrevious || isLoading}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!hasNext || isLoading}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

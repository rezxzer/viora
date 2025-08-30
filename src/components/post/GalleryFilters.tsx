'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image, Video, Star, Pin, Grid3X3 } from 'lucide-react'

export type GalleryFilter = 'all' | 'photos' | 'videos' | 'featured' | 'pinned'

type GalleryFiltersProps = {
  activeFilter: GalleryFilter
  onFilterChange: (filter: GalleryFilter) => void
  hasPhotos: boolean
  hasVideos: boolean
  hasFeatured: boolean
  hasPinned: boolean
}

export default function GalleryFilters({
  activeFilter,
  onFilterChange,
  hasPhotos,
  hasVideos,
  hasFeatured,
  hasPinned,
}: GalleryFiltersProps) {
  const filters = [
    { key: 'all' as const, label: 'All', icon: Grid3X3, alwaysVisible: true },
    { key: 'photos' as const, label: 'Photos', icon: Image, alwaysVisible: hasPhotos },
    { key: 'videos' as const, label: 'Videos', icon: Video, alwaysVisible: hasVideos },
    { key: 'featured' as const, label: 'Featured', icon: Star, alwaysVisible: hasFeatured },
    { key: 'pinned' as const, label: 'Pinned', icon: Pin, alwaysVisible: hasPinned },
  ]

  const visibleFilters = filters.filter((f) => f.alwaysVisible)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {visibleFilters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <filter.icon className="h-4 w-4" />
          {filter.label}
        </Button>
      ))}
    </div>
  )
}

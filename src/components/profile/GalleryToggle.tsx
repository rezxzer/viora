'use client'

import { Button } from '@/components/ui/button'
import { List, Grid3X3 } from 'lucide-react'
import { useEffect, useState } from 'react'

type GalleryToggleProps = {
  mode: 'list' | 'grid'
  onChange: (mode: 'list' | 'grid') => void
  totalPosts?: number
  mediaPosts?: number
}

export default function GalleryToggle({
  mode,
  onChange,
  totalPosts,
  mediaPosts,
}: GalleryToggleProps) {
  const [localMode, setLocalMode] = useState(mode)

  // Load persisted mode from localStorage
  useEffect(() => {
    const persisted = localStorage.getItem('profile.galleryMode') as 'list' | 'grid' | null
    if (persisted && (persisted === 'list' || persisted === 'grid')) {
      setLocalMode(persisted)
      onChange(persisted)
    }
  }, [onChange])

  // Persist mode changes
  useEffect(() => {
    localStorage.setItem('profile.galleryMode', localMode)
  }, [localMode])

  const handleModeChange = (newMode: 'list' | 'grid') => {
    setLocalMode(newMode)
    onChange(newMode)
  }

  const handleKeyDown = (event: React.KeyboardEvent, newMode: 'list' | 'grid') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleModeChange(newMode)
    }
  }

  return (
    <div
      className="flex items-center gap-1 rounded-lg border bg-surface p-1 shadow-soft ring-1 ring-white/5 hover:ring-1 hover:ring-white/10 transition-all duration-200"
      role="tablist"
      aria-label="Gallery view options"
    >
      <Button
        variant={localMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('list')}
        onKeyDown={(e) => handleKeyDown(e, 'list')}
        role="tab"
        aria-selected={localMode === 'list'}
        aria-label="List view"
        title="List view"
        className={`h-8 px-2 transition-all duration-200 ${
          localMode === 'list'
            ? 'font-semibold bg-primary text-primary-foreground shadow-sm hover:shadow-md'
            : 'hover:bg-muted/50 hover:ring-1 hover:ring-primary/20'
        }`}
      >
        <List className="h-4 w-4" />
        {totalPosts !== undefined && (
          <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full text-xs bg-white/5">
            {totalPosts}
          </span>
        )}
      </Button>
      <Button
        variant={localMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('grid')}
        onKeyDown={(e) => handleKeyDown(e, 'grid')}
        role="tab"
        aria-selected={localMode === 'grid'}
        aria-label="Grid view"
        title="Grid view"
        className={`h-8 px-2 transition-all duration-200 ${
          localMode === 'grid'
            ? 'font-semibold bg-primary text-primary-foreground shadow-sm hover:shadow-md'
            : 'hover:bg-muted/50 hover:ring-1 hover:ring-primary/20'
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
        {mediaPosts !== undefined && (
          <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full text-xs bg-white/5">
            {mediaPosts}
          </span>
        )}
      </Button>
    </div>
  )
}

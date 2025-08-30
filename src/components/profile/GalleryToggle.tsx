'use client'

import { Button } from '@/components/ui/button'
import { List, Grid3X3 } from 'lucide-react'

type GalleryToggleProps = {
  mode: 'list' | 'grid'
  onChange: (mode: 'list' | 'grid') => void
}

export default function GalleryToggle({ mode, onChange }: GalleryToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-surface p-1">
      <Button
        variant={mode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        aria-pressed={mode === 'list'}
        aria-label="List view"
        className="h-8 px-2"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        aria-pressed={mode === 'grid'}
        aria-label="Grid view"
        className="h-8 px-2"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  )
}

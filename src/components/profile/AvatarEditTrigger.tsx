'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'

interface AvatarEditTriggerProps {
  children: ReactNode
  onEdit: () => void
  className?: string
}

export default function AvatarEditTrigger({
  children,
  onEdit,
  className = '',
}: AvatarEditTriggerProps) {
  return (
    <div className={`relative group ${className}`}>
      {children}
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:opacity-100"
        onClick={onEdit}
        aria-label="Change avatar"
        title="Change avatar"
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  )
}

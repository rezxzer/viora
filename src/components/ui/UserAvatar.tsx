'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState } from 'react'

interface UserAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  className?: string
}

export function UserAvatar({ src, alt, fallback, className }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // If no src or image failed to load, use placeholder
  const shouldUsePlaceholder = !src || imageError

  // Generate initials from fallback text
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Avatar className={className}>
      {!shouldUsePlaceholder && (
        <AvatarImage src={src} alt={alt} onError={() => setImageError(true)} />
      )}
      <AvatarFallback>
        {shouldUsePlaceholder ? (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
            {fallback ? getInitials(fallback) : 'U'}
          </div>
        ) : fallback ? (
          getInitials(fallback)
        ) : (
          'U'
        )}
      </AvatarFallback>
    </Avatar>
  )
}

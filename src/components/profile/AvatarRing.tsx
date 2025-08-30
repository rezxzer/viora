'use client'

import { ReactNode } from 'react'

type AvatarRingProps = {
  status?: 'online' | 'offline' | 'away'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

export default function AvatarRing({
  status = 'offline',
  size = 'md',
  className = '',
  children,
}: AvatarRingProps) {
  const sizeClasses = {
    sm: 'ring-2',
    md: 'ring-3',
    lg: 'ring-4',
  }

  const statusStyles = {
    online: {
      ring: 'ring-green-500 ring-offset-2 ring-offset-surface',
      glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]',
    },
    offline: {
      ring: 'ring-muted-foreground/30 ring-offset-2 ring-offset-surface',
      glow: '',
    },
    away: {
      ring: 'ring-yellow-500 ring-offset-2 ring-offset-surface',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    },
  }

  const { ring, glow } = statusStyles[status]
  const ringSize = sizeClasses[size]

  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        className={`absolute inset-0 rounded-full ${ringSize} ${ring} ${glow} pointer-events-none`}
        role="presentation"
        aria-hidden="true"
      />
    </div>
  )
}

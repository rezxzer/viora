'use client'

import { CheckCircle } from 'lucide-react'

type VerificationBadgeProps = {
  isVerified?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export default function VerificationBadge({
  isVerified = false,
  size = 'md',
  className = '',
}: VerificationBadgeProps) {
  if (!isVerified) {
    return null
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  }

  const iconSize = sizeClasses[size]

  return (
    <div
      className={`inline-flex items-center justify-center text-blue-500 ${className}`}
      role="img"
      aria-label="Verified account"
      title="Verified account"
    >
      <CheckCircle className={iconSize} />
    </div>
  )
}

'use client'

import ComingSoonBadge from './ComingSoonBadge'
import { cn } from '@/lib/utils'

type ComingSoonNavItemProps = {
  icon: React.ReactNode
  label: string
}

/**
 * ComingSoonNavItem: A disabled navigation item with "Coming Soon" badge.
 */
export default function ComingSoonNavItem({ icon, label }: ComingSoonNavItemProps) {
  const base =
    'relative flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm transition-all outline-none select-none'
  const disabledFx = 'opacity-60 cursor-not-allowed pointer-events-none'

  return (
    <div
      className={cn(
        base,
        disabledFx,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
      )}
      role="button"
      aria-disabled="true"
      tabIndex={-1}
    >
      <div className="flex items-center gap-3">
        <span className="transition-transform duration-200 will-change-transform">
          <span className="[*|svg]:stroke-[1.8] [*|svg]:h-5 [*|svg]:w-5 opacity-60">{icon}</span>
        </span>
        <span className="text-sm transition-colors duration-200 font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <ComingSoonBadge />
    </div>
  )
}

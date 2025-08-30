'use client'

import { ReactNode } from 'react'

type ProfileHeaderLayoutProps = {
  mode?: 'compact' | 'extended'
  children: ReactNode
  avatar?: ReactNode
  title?: ReactNode
  stats?: ReactNode
  actions?: ReactNode
}

export default function ProfileHeaderLayout({
  mode = 'compact',
  children,
  avatar,
  title,
  stats,
  actions,
}: ProfileHeaderLayoutProps) {
  if (mode === 'compact') {
    return (
      <div className="mb-6 overflow-hidden rounded-2xl border bg-surface shadow-soft ring-1 ring-white/5 hover:ring-1 hover:ring-white/10 transition-all duration-200">
        {/* Compact cover */}
        <div className="h-20 w-full bg-gradient-to-r from-primary/25 to-primary/5 relative">
          {children}
        </div>

        {/* Compact layout */}
        <div className="flex items-end justify-between gap-4 px-4 pb-4">
          <div className="-mt-10 flex items-end gap-4">
            {avatar}
            {title}
          </div>
          {actions}
        </div>

        {/* Stats row */}
        {stats && (
          <div className="flex flex-wrap gap-3 border-t border-white/5 px-4 py-3">{stats}</div>
        )}
      </div>
    )
  }

  // Extended layout
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border bg-surface shadow-soft ring-1 ring-white/5 hover:ring-1 hover:ring-white/10 transition-all duration-200">
      {/* Extended cover */}
      <div className="h-32 w-full bg-gradient-to-r from-primary/25 to-primary/5 relative">
        {children}
      </div>

      {/* Extended layout */}
      <div className="px-6 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div className="-mt-16 flex items-end gap-6">
            {avatar}
            <div className="flex-1">
              {title}
              {stats && <div className="mt-4">{stats}</div>}
            </div>
          </div>
          {actions}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItemProps = {
  icon: React.ReactNode
  label: string
  href?: string
  disabled?: boolean
  comingSoon?: boolean
  onClick?: () => void
}

export default function NavItem({
  icon,
  label,
  href = '#',
  disabled,
  comingSoon,
  onClick,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = href !== '#' && pathname?.startsWith(href)

  const Core = (
    <div
      className={cn(
        'group relative overflow-hidden',
        'flex items-center justify-between w-full px-4 py-3 rounded-2xl outline-none transition-all',
        isActive
          ? 'bg-white/5 backdrop-blur border border-white/10 text-white shadow-[0_0_14px_rgba(168,85,247,.25)]'
          : 'text-white/80',
        !disabled && 'hover:scale-[1.01] hover:ring-1 hover:ring-white/5',
        disabled && 'opacity-60 cursor-not-allowed pointer-events-none'
      )}
      data-active={isActive ? 'true' : 'false'}
      role="link"
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
    >
      {/* Content */}
      <div className="flex items-center gap-3">
        {/* ICON — uses currentColor for stroke */}
        <span
          className={cn(
            // Icon box
            '[&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[1.9] transition-colors duration-150',
            isActive
              ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,.35)]'
              : 'text-white/70 group-hover:text-cyan-300'
          )}
        >
          {icon}
        </span>

        {/* LABEL — subtle gradient only on hover */}
        <span
          className={cn(
            'text-sm transition-colors duration-150',
            isActive
              ? 'text-white'
              : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-cyan-300'
          )}
        >
          {label}
        </span>
      </div>

      {/* Underline — thin, local width, no sweeping gradient */}
      <span
        aria-hidden
        className="absolute left-4 right-4 bottom-2 h-[2px] rounded-full w-0
                   group-hover:w-[calc(100%-2rem)]
                   transition-all bg-gradient-to-r from-violet-500 to-cyan-400"
      />

      {/* Inner Active Rail — stays simple */}
      <span
        aria-hidden
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full',
          'bg-gradient-to-b from-violet-500 to-cyan-400',
          'origin-top transition-transform duration-300',
          isActive ? 'scale-y-100' : 'scale-y-0'
        )}
      />

      {comingSoon && (
        <span className="ml-2 text-[11px] px-2 py-[2px] rounded-full bg-white/10 border border-white/10 relative z-10">
          Coming&nbsp;Soon
        </span>
      )}
    </div>
  )

  if (disabled) return <div>{Core}</div>
  return (
    <Link
      href={href}
      className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-white/20"
    >
      {Core}
    </Link>
  )
}

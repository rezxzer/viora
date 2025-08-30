'use client'

import { Home, Newspaper, User, Settings, Crown, Menu, Play, Radio } from 'lucide-react'
import NavItem from './NavItem'
import ComingSoonNavItem from './ComingSoonNavItem'
import VioraLogo from '@/components/brand/VioraLogo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Sidebar with responsive mobile sheet.
 */
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const itemRefs = useRef<HTMLDivElement[]>([])
  const pathname = usePathname()

  // Update active rail position when route changes
  useEffect(() => {
    const active = itemRefs.current.find((el) => el?.dataset.active === 'true')
    const rail = document.getElementById('viora-active-rail')
    if (!active || !rail) return

    const { top, height } = active.getBoundingClientRect()
    const containerTop = active.parentElement!.getBoundingClientRect().top
    rail.style.top = `${top - containerTop + (height / 2 - 20)}px` // centers 40px rail on item
    rail.style.opacity = '1'
  }, [pathname])

  const content = (
    <nav className="flex flex-col gap-1">
      <div
        ref={(el) => {
          if (el) itemRefs.current[0] = el
        }}
        data-active={pathname === '/' ? 'true' : 'false'}
      >
        <NavItem href="/" icon={<Home />} label="Home" onClick={() => setOpen(false)} />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[1] = el
        }}
        data-active={pathname?.startsWith('/feed') ? 'true' : 'false'}
      >
        <NavItem href="/feed" icon={<Newspaper />} label="Feed" onClick={() => setOpen(false)} />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[2] = el
        }}
        data-active={pathname?.startsWith('/watch') ? 'true' : 'false'}
      >
        <NavItem href="/watch" icon={<Play />} label="Watch" onClick={() => setOpen(false)} />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[3] = el
        }}
        data-active="false"
      >
        <ComingSoonNavItem icon={<Radio />} label="Streams" />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[4] = el
        }}
        data-active={pathname?.startsWith('/profile') ? 'true' : 'false'}
      >
        <NavItem href="/profile" icon={<User />} label="Profile" onClick={() => setOpen(false)} />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[5] = el
        }}
        data-active={pathname?.startsWith('/settings') ? 'true' : 'false'}
      >
        <NavItem
          href="/settings"
          icon={<Settings />}
          label="Settings"
          onClick={() => setOpen(false)}
        />
      </div>
      <div
        ref={(el) => {
          if (el) itemRefs.current[6] = el
        }}
        data-active={pathname?.startsWith('/premium') ? 'true' : 'false'}
      >
        <NavItem href="/premium" icon={<Crown />} label="Premium" onClick={() => setOpen(false)} />
      </div>
    </nav>
  )

  return (
    <aside className="border-r bg-surface p-3 shadow-soft">
      {/* Logo */}
      <div className="mb-6 px-2">
        <VioraLogo size="md" withWordmark={true} />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block min-w-[220px] relative">
        {/* animated rail */}
        <div
          id="viora-active-rail"
          aria-hidden
          className="pointer-events-none absolute left-2 top-0 h-10 w-[3px] rounded-full
                     bg-gradient-to-b from-violet-500 to-cyan-400
                     transition-all duration-300 ease-out animate-[viora-rail-breathe_3.6s_ease-in-out_infinite]
                     motion-reduce:animate-none"
          style={{ opacity: 0 }}
        />
        {content}
      </div>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-surface">
            {content}
          </SheetContent>
        </Sheet>
      </div>
    </aside>
  )
}

'use client'

import { useCallback, useRef } from 'react'

type RippleProps = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export default function Ripple({ children, className = '', disabled = false }: RippleProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const ripple = document.createElement('span')
      ripple.className = 'ripple-effect'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      container.appendChild(ripple)

      // Clean up ripple after animation
      const handleAnimationEnd = () => {
        ripple.remove()
      }

      ripple.addEventListener('animationend', handleAnimationEnd, { once: true })
    },
    [disabled]
  )

  return (
    <div ref={containerRef} className={`ripple-container ${className}`} onMouseDown={createRipple}>
      {children}
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type CoverGradientProps = {
  variant?: 'default' | 'premium' | 'custom'
  animate?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function CoverGradient({
  variant = 'default',
  animate = true,
  className = '',
  style,
}: CoverGradientProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const shouldAnimate = animate && !prefersReducedMotion

  const gradientVariants = {
    default: {
      from: 'from-primary/20 via-primary/10 to-transparent',
      customStyle: {
        '--cg-from': 'hsl(var(--color-primary) / 0.2)',
        '--cg-via': 'hsl(var(--color-primary) / 0.1)',
        '--cg-to': 'transparent',
      } as React.CSSProperties,
    },
    premium: {
      from: 'from-violet-500/30 via-purple-500/20 to-cyan-500/10',
      customStyle: {
        '--cg-from': 'hsl(262 83% 58% / 0.3)',
        '--cg-via': 'hsl(262 83% 58% / 0.2)',
        '--cg-to': 'hsl(180 100% 50% / 0.1)',
      } as React.CSSProperties,
    },
    custom: {
      from: 'from-surface/20 via-elev/10 to-transparent',
      customStyle: {
        '--cg-from': 'hsl(var(--color-surface) / 0.2)',
        '--cg-via': 'hsl(var(--color-elev) / 0.1)',
        '--cg-to': 'transparent',
      } as React.CSSProperties,
    },
  }

  const { from, customStyle } = gradientVariants[variant]
  const mergedStyle = { ...customStyle, ...style }

  const MotionWrapper = shouldAnimate ? motion.div : 'div'
  const motionProps = shouldAnimate
    ? {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: 'easeOut' as const },
      }
    : {}

  return (
    <MotionWrapper
      className={`absolute inset-0 pointer-events-none ${from} bg-gradient-to-b ${className}`}
      style={mergedStyle}
      {...motionProps}
      role="presentation"
      aria-hidden="true"
    />
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Minimal theme toggle using documentElement data-theme.
 * Persists choice in localStorage.
 */
export default function ThemeToggle() {
  const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system')

  useEffect(() => {
    const saved = (() => {
      try {
        return (localStorage.getItem('viora-theme') as typeof mode) || 'system'
      } catch {
        return 'system'
      }
    })()
    setMode(saved)
    const root = document.documentElement
    if (saved === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', saved)
    }
  }, [])

  function apply(next: typeof mode) {
    const root = document.documentElement
    if (next === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', next)
    }
  }

  function cycle() {
    const order: (typeof mode)[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(mode) + 1) % order.length]
    setMode(next)
    try {
      localStorage.setItem('viora-theme', next)
    } catch {
      // Storage access denied, continue without saving
    }
    apply(next)
  }

  return (
    <Button variant="outline" size="sm" aria-label="Toggle theme" onClick={cycle}>
      {mode === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span className="hidden lg:inline-block text-xs">Theme</span>
    </Button>
  )
}

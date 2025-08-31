'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  id: string
  title: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning'
  onRemove: (id: string) => void
}

export function Toast({ id, title, description, type = 'default', onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(id), 150)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-900'
      case 'error':
        return 'border-red-500 bg-red-50 text-red-900'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900'
      default:
        return 'border-border bg-surface text-foreground'
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-200',
        getTypeStyles(),
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
        </div>
        <button
          onClick={handleRemove}
          className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Array<{ id: string; title: string; description?: string; type?: string }>
  onRemove: (id: string) => void
}) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          type={toast.type as 'default' | 'success' | 'error' | 'warning'}
          onRemove={onRemove}
        />
      ))}
    </>
  )
}

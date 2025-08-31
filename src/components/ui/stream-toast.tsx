'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface StreamToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function StreamToast({ message, type, onClose, duration = 5000 }: StreamToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 border rounded-lg shadow-lg transition-opacity duration-300 ${getBgColor()}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="text-sm font-medium text-gray-900">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

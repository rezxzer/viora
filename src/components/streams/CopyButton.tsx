'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text?: string // Made optional: can use value instead
  value?: string // Added: value prop for compatibility
  label?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export default function CopyButton({
  text,
  value, // Added: value prop
  label = 'Copy',
  variant = 'secondary',
  size = 'sm',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  // Use value if provided, otherwise fall back to text
  const textToCopy = value || text || ''

  if (!textToCopy) {
    console.warn('CopyButton: Neither text nor value prop provided')
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}

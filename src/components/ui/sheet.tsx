'use client'

import * as React from 'react'
import {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent as BaseContent,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
  DialogHeader as SheetHeader,
  DialogFooter as SheetFooter,
  DialogClose as SheetClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type SheetContentProps = React.ComponentProps<typeof BaseContent> & {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

function SheetContent({ className, side = 'left', ...props }: SheetContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <BaseContent
        className={cn(
          'border bg-surface p-6 shadow-soft',
          'fixed z-50 grid gap-4',
          side === 'left' && 'inset-y-0 left-0 h-screen w-80',
          side === 'right' && 'inset-y-0 right-0 h-screen w-80',
          side === 'top' && 'inset-x-0 top-0 w-full',
          side === 'bottom' && 'inset-x-0 bottom-0 w-full',
          className
        )}
        {...props}
      />
    </DialogPortal>
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetFooter,
  SheetClose,
}

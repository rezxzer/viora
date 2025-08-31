'use client'

import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'
import AvatarUploader from './AvatarUploader'

interface AvatarEditDialogProps {
  userId: string
  initialUrl: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
}

export default function AvatarEditDialog({
  userId,
  initialUrl,
  open,
  onOpenChange,
  trigger,
}: AvatarEditDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change avatar</DialogTitle>
          <DialogDescription>Upload a new profile picture</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AvatarUploader
            userId={userId}
            initialUrl={initialUrl}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pin, Star, PinOff, StarOff } from 'lucide-react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type PostActionsExtraProps = {
  postId: string
  isPinned: boolean
  isFeatured: boolean
  canManage: boolean // user is author or admin
  onUpdate?: () => void
}

export default function PostActionsExtra({
  postId,
  isPinned,
  isFeatured,
  canManage,
  onUpdate,
}: PostActionsExtraProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleTogglePinned = async () => {
    if (!canManage) return

    setIsUpdating(true)
    const supabase = supabaseBrowserClient()

    try {
      const { error } = await supabase.rpc('set_post_pinned', {
        p_post_id: postId,
        p_pin: !isPinned,
      })

      if (error) {
        toast.error('Failed to update pin status')
        return
      }

      toast.success(isPinned ? 'Post unpinned' : 'Post pinned')
      onUpdate?.()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleFeatured = async () => {
    if (!canManage) return

    setIsUpdating(true)
    const supabase = supabaseBrowserClient()

    try {
      const { error } = await supabase.rpc('set_post_featured', {
        p_post_id: postId,
        p_is_featured: !isFeatured,
      })

      if (error) {
        toast.error('Failed to update featured status')
        return
      }

      toast.success(isFeatured ? 'Post unfeatured' : 'Post marked as featured')
      onUpdate?.()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!canManage) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isUpdating}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleTogglePinned}
          disabled={isUpdating}
          className="flex items-center gap-2"
        >
          {isPinned ? (
            <>
              <PinOff className="h-4 w-4" />
              Unpin Post
            </>
          ) : (
            <>
              <Pin className="h-4 w-4" />
              Pin Post
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleToggleFeatured}
          disabled={isUpdating}
          className="flex items-center gap-2"
        >
          {isFeatured ? (
            <>
              <StarOff className="h-4 w-4" />
              Unmark as Featured
            </>
          ) : (
            <>
              <Star className="h-4 w-4" />
              Mark as Featured
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

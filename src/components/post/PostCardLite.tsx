'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, ThumbsUp } from 'lucide-react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

type Props = {
  postId: string
  authorId: string
  createdAt: string
  initialLikesCount: number
  initialCommentsCount: number
  initiallyLiked: boolean
  content?: string | null
  imageUrl?: string | null
}

export default function PostCardLite({
  postId,
  authorId,
  createdAt,
  initialLikesCount,
  initialCommentsCount,
  initiallyLiked,
  content,
  imageUrl,
}: Props) {
  const [likes, setLikes] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initiallyLiked)
  const [isPending, startTransition] = useTransition()
  const supabase = supabaseBrowserClient()
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUid(data.user?.id ?? null)
    })
  }, [supabase])

  const onToggleLike = () => {
    startTransition(async () => {
      try {
        if (!uid) {
          toast.info('Sign in to like')
          return
        }
        if (liked) {
          setLiked(false)
          setLikes((v) => Math.max(0, v - 1))
          const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', uid)
          if (error) {
            setLiked(true)
            setLikes((v) => v + 1)
            toast.error(error.message)
          }
        } else {
          setLiked(true)
          setLikes((v) => v + 1)
          const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: uid })
          if (error) {
            setLiked(false)
            setLikes((v) => Math.max(0, v - 1))
            toast.error(error.message)
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update like'
        toast.error(message)
      }
    })
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleString()}
          </div>
          {typeof content === 'string' && content.trim().length > 0 ? (
            <div className="mt-1 whitespace-pre-wrap break-words text-sm">{content}</div>
          ) : null}
          {imageUrl ? (
            <div className="mt-3 overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="post media" className="h-auto w-full object-cover" />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button
            aria-label="comments"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
            disabled
          >
            <MessageCircle className="h-4 w-4" /> {initialCommentsCount}
          </button>
          <Button
            variant={liked ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleLike}
            disabled={isPending}
          >
            <ThumbsUp className="h-4 w-4 mr-1" /> {likes}
          </Button>
        </div>
      </div>
    </Card>
  )
}

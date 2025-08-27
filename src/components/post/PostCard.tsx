'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { MessageCircle, Share2, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import TipDialog from '@/app/u/[username]/TipDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import CommentsDialog from './CommentsDialog'

type Props = {
  postId: string
  authorId: string
  authorUsername: string | null
  authorFullName: string | null
  authorAvatarUrl: string | null
  createdAt: string
  content: string | null
  imageUrl: string | null
  initialLikesCount: number
  initialCommentsCount: number
  initiallyLiked: boolean
  viewerId?: string | null
  assets?: Array<{ url: string; mime_type: string }>
}

export default function PostCard({
  postId,
  authorId,
  authorUsername,
  authorFullName,
  authorAvatarUrl,
  createdAt,
  content,
  imageUrl,
  initialLikesCount,
  initialCommentsCount,
  initiallyLiked,
  viewerId = null,
  assets = [],
}: Props) {
  const [likes, setLikes] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initiallyLiked)
  const [isPending, startTransition] = useTransition()
  const supabase = supabaseBrowserClient()

  const onToggleLike = () => {
    if (!viewerId) {
      toast.info('Sign in to like posts')
      return
    }
    startTransition(async () => {
      try {
        if (liked) {
          setLiked(false)
          setLikes((v) => Math.max(0, v - 1))
          const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', viewerId)
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
            .insert({ post_id: postId, user_id: viewerId })
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

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/post/${postId}`)
      toast.success('Link copied')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [recentComments, setRecentComments] = useState<
    Array<{
      id: string
      author_id: string
      content: string
      created_at: string
      author: { name: string; avatar_url: string | null }
    }>
  >([])

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const { data: rows, error } = await supabase
          .from('post_comments')
          .select('id, author_id, content, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })
          .limit(2)
        if (error) return
        const list = (rows ?? []) as Array<{
          id: string
          author_id: string
          content: string
          created_at: string
        }>
        if (list.length === 0) {
          setRecentComments([])
          return
        }
        const authorIds = Array.from(new Set(list.map((r) => r.author_id)))
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', authorIds)
        const map = new Map<string, { name: string; avatar_url: string | null }>()
        ;(profs ?? []).forEach(
          (p: {
            id: string
            username: string | null
            full_name: string | null
            avatar_url: string | null
          }) => {
            map.set(p.id, {
              name: p.full_name || p.username || 'User',
              avatar_url: p.avatar_url ?? null,
            })
          }
        )
        const decorated = list
          .map((r) => ({
            id: r.id,
            author_id: r.author_id,
            content: r.content,
            created_at: r.created_at,
            author: map.get(r.author_id) ?? { name: 'User', avatar_url: null },
          }))
          .reverse()
        setRecentComments(decorated)
      } catch {
        // ignore silently
      }
    }
    void loadRecent()

    // Realtime preview for last two comments
    const ch = supabase
      .channel(`comments-preview:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new as {
              id: string
              author_id: string
              content: string
              created_at: string
            }
            setRecentComments((prev) =>
              [
                ...prev,
                {
                  id: r.id,
                  author_id: r.author_id,
                  content: r.content,
                  created_at: r.created_at,
                  author: prev.find((p) => p.author_id === r.author_id)?.author ?? {
                    name: 'User',
                    avatar_url: null,
                  },
                },
              ].slice(-2)
            )
            setCommentsCount((v) => v + 1)
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new as { id: string; content: string }
            setRecentComments((prev) =>
              prev.map((c) => (c.id === r.id ? { ...c, content: r.content } : c))
            )
          } else if (payload.eventType === 'DELETE') {
            const r = payload.old as { id: string }
            setRecentComments((prev) => prev.filter((c) => c.id !== r.id))
            setCommentsCount((v) => Math.max(0, v - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [postId])

  // Media classification
  const imageAssets = (assets || []).filter(
    (a) =>
      a &&
      (a.mime_type?.startsWith('image/') ||
        /\.(png|jpe?g|gif|webp|avif|svg)(?:\?.*)?$/i.test(a.url))
  )
  const videoAssets = (assets || []).filter(
    (a) => a && (a.mime_type?.startsWith('video/') || /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(a.url))
  )

  // Build display list prioritizing assets; fall back to legacy imageUrl
  const displayImageUrls: string[] = imageAssets.map((a) => a.url)
  if (!displayImageUrls.length && imageUrl) {
    displayImageUrls.push(imageUrl)
  }

  const showSingleVideo = videoAssets.length > 0 && displayImageUrls.length === 0

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightboxAt = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }
  const onPrev = () =>
    setLightboxIndex((i) => (i - 1 + displayImageUrls.length) % displayImageUrls.length)
  const onNext = () => setLightboxIndex((i) => (i + 1) % displayImageUrls.length)

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <a href={authorUsername ? `/u/${authorUsername}` : `#`} className="shrink-0">
          <UserAvatar src={authorAvatarUrl} alt="avatar" fallback="U" />
        </a>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{authorFullName || authorUsername || 'Unknown'}</span>
              {authorUsername ? (
                <a href={`/u/${authorUsername}`} className="text-muted-foreground hover:underline">
                  @{authorUsername}
                </a>
              ) : (
                <span className="text-muted-foreground">@user</span>
              )}
              <span className="text-muted-foreground">
                · {new Date(createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          {content ? <div className="whitespace-pre-wrap text-sm">{content}</div> : null}
          {/* Media Section */}
          {showSingleVideo ? (
            <video
              controls
              className="rounded-xl border max-h-[420px] w-full"
              src={videoAssets[0].url}
            />
          ) : displayImageUrls.length > 0 ? (
            displayImageUrls.length === 1 ? (
              // Single image
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImageUrls[0]}
                alt="media"
                className="rounded-xl border max-h-[420px] w-full object-cover cursor-zoom-in"
                onClick={() => openLightboxAt(0)}
              />
            ) : (
              // 2-4 images grid
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden border">
                {displayImageUrls.slice(0, 4).map((url, idx) => {
                  const isFirst = idx === 0 && displayImageUrls.length === 3
                  const baseClasses = 'relative w-full overflow-hidden bg-elev cursor-zoom-in'
                  const sizeClasses = isFirst ? 'col-span-2 aspect-video' : 'aspect-square'
                  return (
                    <button
                      key={url + idx}
                      type="button"
                      className={`${baseClasses} ${sizeClasses}`}
                      onClick={() => openLightboxAt(idx)}
                      aria-label="Open media"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="media"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            )
          ) : null}

          {/* Inline recent comments preview */}
          {recentComments.length > 0 ? (
            <div className="space-y-2 pt-1">
              {recentComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <UserAvatar
                    src={c.author.avatar_url}
                    alt="avatar"
                    fallback="U"
                    className="h-6 w-6"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.author.name}</span> ·{' '}
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{c.content}</div>
                  </div>
                </div>
              ))}
              <button
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => setCommentsOpen(true)}
              >
                View all comments
              </button>
            </div>
          ) : null}

          {/* Lightbox */}
          {displayImageUrls.length > 0 ? (
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent
                className="max-w-5xl p-0 bg-transparent border-0 shadow-none"
                showCloseButton
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>Post media viewer</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImageUrls[lightboxIndex]}
                    alt="media"
                    className="max-h-[85vh] w-auto h-auto rounded-lg"
                  />
                  {displayImageUrls.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/70 focus:outline-hidden"
                        onClick={onPrev}
                        aria-label="Previous"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/70 focus:outline-hidden"
                        onClick={onNext}
                        aria-label="Next"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Button
                variant={liked ? 'secondary' : 'outline'}
                size="sm"
                onClick={onToggleLike}
                disabled={isPending}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> {likes}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCommentsOpen(true)}>
                <MessageCircle className="h-4 w-4 mr-1" /> {commentsCount}
              </Button>
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
            </div>
            <TipDialog creatorId={authorId} />
          </div>
        </div>
      </div>
      {/* Comments Dialog */}
      <CommentsDialog
        postId={postId}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        viewerId={viewerId ?? null}
        postAuthorId={authorId}
        onCommentAdded={() => {
          setCommentsCount((v) => v + 1)
          // refresh preview
          ;(async () => {
            try {
              const { data: rows } = await supabase
                .from('post_comments')
                .select('id, author_id, content, created_at')
                .eq('post_id', postId)
                .order('created_at', { ascending: false })
                .limit(2)
              const list = (rows ?? []) as Array<{
                id: string
                author_id: string
                content: string
                created_at: string
              }>
              const authorIds = Array.from(new Set(list.map((r) => r.author_id)))
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', authorIds)
              const map = new Map<string, { name: string; avatar_url: string | null }>()
              ;(profs ?? []).forEach(
                (p: {
                  id: string
                  username: string | null
                  full_name: string | null
                  avatar_url: string | null
                }) => {
                  map.set(p.id, {
                    name: p.full_name || p.username || 'User',
                    avatar_url: p.avatar_url ?? null,
                  })
                }
              )
              const decorated = list
                .map((r) => ({
                  id: r.id,
                  author_id: r.author_id,
                  content: r.content,
                  created_at: r.created_at,
                  author: map.get(r.author_id) ?? { name: 'User', avatar_url: null },
                }))
                .reverse()
              setRecentComments(decorated)
            } catch {}
          })()
        }}
      />
    </Card>
  )
}

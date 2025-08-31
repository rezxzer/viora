'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, MessageCircle, Volume2, VolumeX, Share2, Flag } from 'lucide-react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import CommentsDialog from '@/components/post/CommentsDialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Item = {
  id: string
  author_id: string
  created_at: string
  content: string | null
  image_url: string | null
  likes_count: number
  comments_count: number
  assets: Array<{ url: string; mime_type: string }>
}

export default function WatchClient({
  initialItems,
  initialViewerId,
}: {
  initialItems: Item[]
  initialViewerId: string | null
}) {
  const supabase = supabaseBrowserClient()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [muted, setMuted] = useState(true)
  const [viewerId, setViewerId] = useState<string | null>(initialViewerId)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [likesMap, setLikesMap] = useState<Map<string, number>>(new Map())
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)
  const [videosOnly, setVideosOnly] = useState<boolean>(false)
  const [lastCommentMap, setLastCommentMap] = useState<
    Map<string, { author: string | null; content: string; created_at: string }>
  >(new Map())
  const [itemsState, setItemsState] = useState<Item[]>(initialItems)
  const [loadingMore, setLoadingMore] = useState(false)
  // Video progress/scrub state
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const durationMapRef = useRef<Map<string, number>>(new Map())
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map())
  const [hoverPercentMap, setHoverPercentMap] = useState<Map<string, number>>(new Map())
  const draggingRef = useRef<{ id: string | null; rect: DOMRect | null }>({ id: null, rect: null })
  const [readyMap, setReadyMap] = useState<Map<string, boolean>>(new Map())
  // report dialog state
  type ReportReason = 'spam' | 'nsfw' | 'abuse' | 'other'
  const [reportOpen, setReportOpen] = useState<boolean>(false)
  const [reportPostId, setReportPostId] = useState<string>('')
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportNote, setReportNote] = useState<string>('')
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false)

  // In-memory cache for author profiles
  const authorCacheRef = useRef<
    Map<string, { username: string | null; full_name: string | null; avatar_url: string | null }>
  >(new Map())

  // share helpers
  const getWatchUrl = (postId: string, withTimestamp?: boolean) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    let url = `${origin}/watch?post=${encodeURIComponent(postId)}`
    if (withTimestamp) {
      const ct = videoRefs.current.get(postId)?.currentTime ?? 0
      const t = Math.max(0, Math.floor(ct))
      url += `&t=${t}`
    }
    return url
  }

  const handleShare = async (postId: string, withTimestamp?: boolean) => {
    const url = getWatchUrl(postId, withTimestamp)
    try {
      // Web Share API with loose typing
      const navAny =
        typeof navigator !== 'undefined'
          ? (navigator as unknown as {
              share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>
            })
          : undefined
      if (navAny?.share) {
        await navAny.share({ title: 'ViORA', text: 'Check this video on ViORA', url })
        return
      }
    } catch {
      /* fallthrough to clipboard */
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Failed to share')
    }
  }

  const shareToTelegram = (postId: string) => {
    const url = encodeURIComponent(getWatchUrl(postId))
    const text = encodeURIComponent('Check this video on ViORA')
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const shareToX = (postId: string) => {
    const url = encodeURIComponent(getWatchUrl(postId))
    const text = encodeURIComponent('Check this video on ViORA')
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  useEffect(() => {
    // load mute preference
    try {
      const saved = (() => {
        try {
          return localStorage.getItem('watch_muted')
        } catch {
          return null
        }
      })()
      if (saved === '0') setMuted(false)
      if (saved === '1') setMuted(true)
    } catch {}
    if (initialViewerId) return
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null))
  }, [supabase, initialViewerId])

  // persist mute preference
  useEffect(() => {
    try {
      localStorage.setItem('watch_muted', muted ? '1' : '0')
    } catch {}
    // also reflect on active videos immediately
    videoRefs.current.forEach((v) => {
      try {
        v.muted = muted
      } catch {}
    })
  }, [muted])

  const items = itemsState

  // intersection observer: only current slide plays
  useEffect(() => {
    if (!containerRef.current) return
    const opts = { root: null, rootMargin: '0px', threshold: 0.75 }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target as HTMLDivElement
        const id = el.dataset.id!
        const vid = videoRefs.current.get(id)
        if (!vid) return
        if (e.isIntersecting) {
          try {
            if (muted) vid.muted = true
            vid.play().catch(() => {})
          } catch {}
        } else {
          try {
            vid.pause()
          } catch {}
        }
      })
    }, opts)
    const nodes = Array.from(containerRef.current.querySelectorAll('[data-id]'))
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [muted, items.length])

  // Infinite scroll: watch the last visible card
  useEffect(() => {
    if (!containerRef.current || items.length === 0) return
    const lastId = (
      videosOnly
        ? items.filter((it) => (it.assets || []).some((a) => a.mime_type?.startsWith('video/')))
        : items
    )[items.length - 1]?.id
    if (!lastId) return
    const el = containerRef.current.querySelector(`[data-id="${lastId}"]`)
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            void loadMore()
          }
        })
      },
      { root: null, threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, videosOnly])

  const loadMore = async () => {
    if (loadingMore) return
    if (items.length === 0) return
    setLoadingMore(true)
    try {
      const cursor = items[items.length - 1]!.created_at
      const { data: stats } = await supabase
        .from('v_post_stats_public')
        .select('post_id, author_id, created_at, likes_count, comments_count')
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(24)
      const ids = (stats ?? []).map((s) => s.post_id)
      if (ids.length === 0) return
      const [{ data: posts }, { data: assets }] = await Promise.all([
        supabase
          .from('posts')
          .select('id, author_id, content, image_url, created_at')
          .in('id', ids),
        supabase.from('post_assets').select('post_id, url, mime_type').in('post_id', ids),
      ])
      const assetsMap = new Map<string, Array<{ url: string; mime_type: string }>>()
      ;((assets ?? []) as Array<{ post_id: string; url: string; mime_type: string }>).forEach(
        (a) => {
          const arr = assetsMap.get(a.post_id) ?? []
          arr.push({ url: a.url, mime_type: a.mime_type })
          assetsMap.set(a.post_id, arr)
        }
      )
      let next: Item[] = (stats ?? []).map((s) => {
        const p = (posts ?? []).find((x) => x.id === s.post_id) || null
        return {
          id: s.post_id,
          author_id: s.author_id,
          created_at: s.created_at,
          content: p?.content ?? null,
          image_url: p?.image_url ?? null,
          likes_count: s.likes_count ?? 0,
          comments_count: s.comments_count ?? 0,
          assets: assetsMap.get(s.post_id) ?? [],
        }
      })
      if (videosOnly) {
        next = next.filter((it) => (it.assets || []).some((a) => a.mime_type?.startsWith('video/')))
      }
      if (next.length) setItemsState((prev) => [...prev, ...next])
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleLike = async (postId: string) => {
    if (!viewerId) return toast.info('Sign in to like')
    const has = likedSet.has(postId)
    const next = new Set(likedSet)
    if (has) next.delete(postId)
    else next.add(postId)
    setLikedSet(next)
    setLikesMap((prev) => {
      const m = new Map(prev)
      const cur = m.get(postId) ?? items.find((i) => i.id === postId)?.likes_count ?? 0
      m.set(postId, Math.max(0, cur + (has ? -1 : 1)))
      return m
    })
    try {
      if (has) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', viewerId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: viewerId })
        if (error) throw error
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to like')
      // revert on error
      setLikedSet((prev) => {
        const m = new Set(prev)
        if (has) m.add(postId)
        else m.delete(postId)
        return m
      })
      setLikesMap((prev) => {
        const m = new Map(prev)
        const cur = m.get(postId) ?? items.find((i) => i.id === postId)?.likes_count ?? 0
        m.set(postId, Math.max(0, cur + (has ? 1 : -1)))
        return m
      })
    }
  }

  // Initialize likes map and fetch which of visible posts the viewer has liked
  useEffect(() => {
    // seed counts
    setLikesMap(() => {
      const m = new Map<string, number>()
      items.forEach((it) => m.set(it.id, it.likes_count))
      return m
    })
    if (!viewerId || items.length === 0) return
    const ids = items.map((i) => i.id)
    ;(async () => {
      try {
        const { data } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', viewerId)
          .in('post_id', ids)
        const set = new Set<string>((data ?? []).map((r: { post_id: string }) => r.post_id))
        setLikedSet(set)
      } catch {}
    })()
  }, [supabase, viewerId, items])

  // Load last comment preview (one request per post to avoid cross-mixing)
  useEffect(() => {
    if (items.length === 0) {
      setLastCommentMap(new Map())
      return
    }
    const ids = items.map((i) => i.id)
    ;(async () => {
      try {
        const results = await Promise.all(
          ids.map(async (postId) => {
            const { data } = await supabase
              .from('comments')
              .select('post_id, content, created_at, author_id')
              .eq('post_id', postId)
              .order('created_at', { ascending: false })
              .limit(1)
            const row =
              (
                data as Array<{
                  post_id: string
                  content: string
                  created_at: string
                  author_id: string
                }> | null
              )?.[0] || null
            return row
          })
        )
        const authorIds = Array.from(
          new Set(
            results
              .filter(
                (
                  r
                ): r is {
                  post_id: string
                  content: string
                  created_at: string
                  author_id: string
                } => !!r
              )
              .map((r) => r.author_id)
          )
        )
        const profMap = new Map<string, { username: string | null; full_name: string | null }>()
        if (authorIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', authorIds)
          ;(
            (profs || []) as Array<{
              id: string
              username: string | null
              full_name: string | null
            }>
          ).forEach((p) => profMap.set(p.id, { username: p.username, full_name: p.full_name }))
        }
        const map = new Map<
          string,
          { author: string | null; content: string; created_at: string }
        >()
        results.forEach((r) => {
          if (!r) return
          const nm = profMap.get(r.author_id)
          map.set(r.post_id, {
            author: nm?.full_name || nm?.username || null,
            content: r.content,
            created_at: r.created_at,
          })
        })
        setLastCommentMap(map)
      } catch {
        setLastCommentMap(new Map())
      }
    })()
  }, [supabase, items])

  // Deep-link: scroll to ?post=ID if present
  useEffect(() => {
    if (!containerRef.current) return
    try {
      const params = new URLSearchParams(window.location.search)
      const targetId = params.get('post')
      if (!targetId) return
      const node = containerRef.current.querySelector(
        `[data-id="${targetId}"]`
      ) as HTMLElement | null
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const t = Number(params.get('t') || '0')
      if (t > 0) {
        const trySeek = () => {
          const vid = videoRefs.current.get(targetId)
          if (!vid) return
          // seek when metadata is ready
          if (isFinite(vid.duration) && vid.duration > 0) {
            vid.currentTime = Math.min(vid.duration - 0.1, t)
          } else {
            vid.addEventListener(
              'loadedmetadata',
              () => {
                try {
                  vid.currentTime = Math.min(vid.duration - 0.1, t)
                } catch {}
              },
              { once: true }
            )
          }
        }
        // give layout time to render
        setTimeout(trySeek, 400)
      }
    } catch {}
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Visible list based on videosOnly toggle
  const visibleItems = videosOnly
    ? items.filter((it) => (it.assets || []).some((a) => a.mime_type?.startsWith('video/')))
    : items

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
  const formatTime = (totalSeconds: number) => {
    if (!isFinite(totalSeconds)) return '0:00'
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleHoverMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = clamp01((e.clientX - rect.left) / Math.max(1, rect.width))
    setHoverPercentMap((prev) => {
      const m = new Map(prev)
      m.set(id, pct)
      return m
    })
  }

  const seekToPercent = (id: string, pct: number) => {
    const vid = videoRefs.current.get(id)
    if (!vid) return
    const dur = durationMapRef.current.get(id) ?? vid.duration ?? 0
    if (!dur || !isFinite(dur)) return
    vid.currentTime = clamp01(pct) * dur
  }

  const handleClickSeek = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = clamp01((e.clientX - rect.left) / Math.max(1, rect.width))
    seekToPercent(id, pct)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    draggingRef.current = { id, rect }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    const pct = clamp01((e.clientX - rect.left) / Math.max(1, rect.width))
    seekToPercent(id, pct)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (draggingRef.current.id !== id || !draggingRef.current.rect) return
    const rect = draggingRef.current.rect
    const pct = clamp01((e.clientX - rect.left) / Math.max(1, rect.width))
    seekToPercent(id, pct)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = { id: null, rect: null }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Keyboard shortcuts for the focused/visible item
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // find most visible video
      const parent = containerRef.current
      if (!parent) return
      const cards = Array.from(parent.querySelectorAll('[data-id]')) as HTMLElement[]
      if (cards.length === 0) return
      let id: string | null = null
      let maxVisible = 0
      const viewport = parent.getBoundingClientRect()
      cards.forEach((el) => {
        const r = el.getBoundingClientRect()
        const visible = Math.max(
          0,
          Math.min(r.bottom, viewport.bottom) - Math.max(r.top, viewport.top)
        )
        if (visible > maxVisible) {
          maxVisible = visible
          id = el.getAttribute('data-id')
        }
      })
      if (!id) return
      const vid = videoRefs.current.get(id)
      if (!vid) return

      switch (e.key) {
        case ' ': // space play/pause
          e.preventDefault()
          if (vid.paused) vid.play().catch(() => {})
          else
            try {
              vid.pause()
            } catch {}
          break
        case 'ArrowRight':
          e.preventDefault()
          try {
            vid.currentTime = Math.min(
              (durationMapRef.current.get(id) ?? vid.duration ?? 0) - 0.1,
              vid.currentTime + 5
            )
          } catch {}
          break
        case 'ArrowLeft':
          e.preventDefault()
          try {
            vid.currentTime = Math.max(0, vid.currentTime - 5)
          } catch {}
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setMuted((m) => !m)
          break
        case 'ArrowUp':
          e.preventDefault()
          try {
            vid.volume = Math.min(1, vid.volume + 0.1)
          } catch {}
          break
        case 'ArrowDown':
          e.preventDefault()
          try {
            vid.volume = Math.max(0, vid.volume - 0.1)
          } catch {}
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openReportFor = (postId: string) => {
    setReportPostId(postId)
    setReportReason('spam')
    setReportNote('')
    setReportOpen(true)
  }

  const submitReport = async () => {
    if (!reportPostId) return
    setReportSubmitting(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({ post_id: reportPostId, reason: reportReason, note: reportNote || null })
      if (error) throw error
      toast.success('Reported')
      setReportOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to report')
    } finally {
      setReportSubmitting(false)
    }
  }

  // Small author badge component (inline for simplicity)
  function AuthorBadge({ authorId }: { authorId: string }) {
    const [profile, setProfile] = useState<{
      username: string | null
      full_name: string | null
      avatar_url: string | null
    } | null>(null)
    const [following, setFollowing] = useState<boolean>(false)
    const [loadingFollow, setLoadingFollow] = useState<boolean>(false)
    useEffect(() => {
      let mounted = true
      const cached = authorCacheRef.current.get(authorId)
      if (cached) {
        setProfile(cached)
        return
      }
      ;(async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', authorId)
            .single()
          if (!mounted) return
          const p = (data as {
            username: string | null
            full_name: string | null
            avatar_url: string | null
          } | null) || { username: null, full_name: null, avatar_url: null }
          authorCacheRef.current.set(authorId, p)
          setProfile(p)
        } catch {}
      })()
      return () => {
        mounted = false
      }
    }, [authorId])

    // load follow relation for viewer
    useEffect(() => {
      if (!viewerId || viewerId === authorId) return
      let cancelled = false
      ;(async () => {
        try {
          const { data } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', viewerId)
            .eq('followee_id', authorId)
            .maybeSingle()
          if (!cancelled) setFollowing(!!data)
        } catch {}
      })()
      return () => {
        cancelled = true
      }
    }, [viewerId, authorId])

    const name = profile?.full_name || profile?.username || 'User'
    const href = profile?.username ? `/u/${profile.username}` : `/u/id/${authorId}`
    const onToggleFollow = async () => {
      if (!viewerId || viewerId === authorId) return
      setLoadingFollow(true)
      try {
        if (following) {
          const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', viewerId)
            .eq('followee_id', authorId)
          if (!error) {
            setFollowing(false)
            toast.success('Unfollowed')
          } else toast.error(error.message)
        } else {
          const { error } = await supabase
            .from('follows')
            .insert({ follower_id: viewerId, followee_id: authorId })
          if (!error) {
            setFollowing(true)
            toast.success('Followed')
          } else toast.error(error.message)
        }
      } finally {
        setLoadingFollow(false)
      }
    }

    return (
      <div className="pointer-events-auto inline-flex items-center gap-2">
        {href ? (
          <a
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/50"
            aria-label={`Open profile of ${name}`}
          >
            <Avatar className="h-6 w-6">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={name} />
              ) : (
                <AvatarFallback>{(name || 'U').slice(0, 1)}</AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs max-w-[140px] truncate">{name}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-2 py-1 text-white">
            <Avatar className="h-6 w-6">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={name} />
              ) : (
                <AvatarFallback>{(name || 'U').slice(0, 1)}</AvatarFallback>
              )}
            </Avatar>
            <span className="text-xs max-w-[140px] truncate">{name}</span>
          </span>
        )}
        {viewerId && viewerId !== authorId ? (
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-full border bg-black/30 px-2 text-xs text-white hover:bg-black/50"
            onClick={onToggleFollow}
            disabled={loadingFollow}
            aria-label={following ? 'Unfollow' : 'Follow'}
          >
            {loadingFollow ? '...' : following ? 'Following' : 'Follow'}
          </button>
        ) : null}
      </div>
    )
  }

  // View tracking: when card is ≥75% visible for 3s, insert into post_views (30s debounced)
  useEffect(() => {
    if (!containerRef.current) return
    const parent = containerRef.current
    const seenAt = new Map<string, number>()
    const lastSentAt = new Map<string, number>()
    const threshold = 0.75
    const dwellMs = 3000
    const debounceMs = 30000

    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now()
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).getAttribute('data-id')
          if (!id) return
          if (e.intersectionRatio >= threshold) {
            if (!seenAt.has(id)) seenAt.set(id, now)
          } else {
            seenAt.delete(id)
          }
        })
      },
      { root: parent, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    const nodes = Array.from(parent.querySelectorAll('[data-id]'))
    nodes.forEach((n) => observer.observe(n))

    const timer = setInterval(async () => {
      const now = Date.now()
      for (const [id, startMs] of Array.from(seenAt.entries())) {
        if (now - startMs >= dwellMs) {
          const last = lastSentAt.get(id) ?? 0
          if (now - last < debounceMs) continue
          lastSentAt.set(id, now)
          try {
            await supabase.from('post_views').insert({ post_id: id })
          } catch {}
        }
      }
    }, 1000)

    return () => {
      observer.disconnect()
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, items.length])

  return (
    <div
      ref={containerRef}
      className="relative mx-auto h-[calc(100vh-72px)] max-w-[720px] snap-y snap-mandatory overflow-y-auto"
    >
      {/* Top-left controls */}
      <div className="pointer-events-auto absolute left-2 top-2 z-10 flex items-center gap-2">
        <label className="inline-flex items-center gap-1 text-xs rounded-full border bg-black/40 px-2 py-1 text-white">
          <input
            type="checkbox"
            checked={videosOnly}
            onChange={(e) => {
              setVideosOnly(e.target.checked)
              // reset viewport to first item for UX
              containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
          Videos only
        </label>
      </div>

      {visibleItems.map((it, idx) => {
        const v = (it.assets || []).find((a) => a.mime_type?.startsWith('video/')) || null
        const isVideo = !!v
        return (
          <div
            key={it.id}
            data-id={it.id}
            className="relative mb-6 h-[80vh] snap-start overflow-hidden rounded-2xl border bg-black"
            onTouchStart={(e) =>
              ((e.currentTarget as HTMLDivElement).dataset.ts = String(
                e.changedTouches[0]?.clientY ?? 0
              ))
            }
            onTouchEnd={(e) => {
              const startY = Number((e.currentTarget as HTMLDivElement).dataset.ts || 0)
              const endY = e.changedTouches[0]?.clientY ?? startY
              const delta = endY - startY
              const parent = containerRef.current
              if (!parent) return
              if (Math.abs(delta) > 50) {
                const children = Array.from(parent.querySelectorAll('[data-id]'))
                const currentIndex = children.findIndex((el) => el === e.currentTarget)
                const targetIndex = delta < 0 ? currentIndex + 1 : currentIndex - 1
                const target = children[targetIndex] as HTMLElement | undefined
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            {isVideo ? (
              <>
                <video
                  src={v!.url}
                  className={`h-full w-full object-contain transition-opacity duration-300 ${readyMap.get(it.id) ? 'opacity-100' : 'opacity-0'}`}
                  playsInline
                  muted={muted}
                  controls={false}
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    durationMapRef.current.set(it.id, e.currentTarget.duration || 0)
                  }}
                  onTimeUpdate={(e) => {
                    const dur = durationMapRef.current.get(it.id) ?? e.currentTarget.duration ?? 0
                    const pct = dur ? e.currentTarget.currentTime / dur : 0
                    setProgressMap((prev) => {
                      const m = new Map(prev)
                      m.set(it.id, pct)
                      return m
                    })
                  }}
                  onClick={(e) => {
                    const vid = e.currentTarget
                    if (vid.paused) {
                      vid.play().catch(() => {})
                    } else {
                      try {
                        vid.pause()
                      } catch {}
                    }
                  }}
                  onEnded={(e) => {
                    const vid = e.currentTarget
                    vid.currentTime = 0
                    setProgressMap((prev) => {
                      const m = new Map(prev)
                      m.set(it.id, 0)
                      return m
                    })
                    vid.play().catch(() => {})
                  }}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const isRight = e.clientX - rect.left > rect.width / 2
                    const delta = isRight ? 10 : -10
                    const vEl = e.currentTarget
                    try {
                      const dur = durationMapRef.current.get(it.id) ?? vEl.duration ?? 0
                      vEl.currentTime = Math.max(
                        0,
                        Math.min(Math.max(0, dur - 0.1), vEl.currentTime + delta)
                      )
                    } catch {}
                  }}
                  onCanPlay={() =>
                    setReadyMap((prev) => {
                      const m = new Map(prev)
                      m.set(it.id, true)
                      return m
                    })
                  }
                  // Attach HLS.js when source is .m3u8 and browser needs it
                  ref={(el) => {
                    if (el) {
                      videoRefs.current.set(it.id, el)
                      try {
                        const url = v!.url
                        if (url.endsWith('.m3u8')) {
                          const canNative = el.canPlayType('application/vnd.apple.mpegurl') !== ''
                          if (!canNative) {
                            import('hls.js')
                              .then(({ default: Hls }) => {
                                if (Hls.isSupported()) {
                                  const hls = new Hls({ enableWorker: true })
                                  hls.loadSource(url)
                                  hls.attachMedia(el)
                                }
                              })
                              .catch(() => {})
                          }
                        }
                      } catch {}
                    }
                  }}
                />
                {/* Poster / skeleton */}
                {!readyMap.get(it.id) ? (
                  it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="poster"
                      src={it.image_url}
                      className="absolute inset-0 h-full w-full object-contain blur-sm opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="h-24 w-24 animate-pulse rounded-xl bg-white/10" />
                    </div>
                  )
                ) : null}
              </>
            ) : it.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.image_url} alt="media" className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                No media
              </div>
            )}

            {/* Scrub/Seek bar */}
            {isVideo ? (
              <div
                className="absolute inset-x-0 bottom-0 z-10 h-8 px-3 pb-2 pt-3"
                onMouseMove={(e) => handleHoverMove(e, it.id)}
                onMouseLeave={() =>
                  setHoverPercentMap((prev) => {
                    const m = new Map(prev)
                    m.delete(it.id)
                    return m
                  })
                }
                onClick={(e) => handleClickSeek(e, it.id)}
                onPointerDown={(e) => handlePointerDown(e, it.id)}
                onPointerMove={(e) => handlePointerMove(e, it.id)}
                onPointerUp={handlePointerUp}
              >
                <div className="relative h-1.5 w-full rounded-full bg-white/25">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${Math.round((progressMap.get(it.id) ?? 0) * 100)}%` }}
                  />
                  {hoverPercentMap.has(it.id) ? (
                    <>
                      <div
                        className="absolute -top-5 h-[18px] rounded bg-black/70 px-1.5 text-[10px] leading-[18px] text-white"
                        style={{ left: `calc(${(hoverPercentMap.get(it.id) ?? 0) * 100}% - 12px)` }}
                      >
                        {formatTime(
                          (durationMapRef.current.get(it.id) ?? 0) *
                            (hoverPercentMap.get(it.id) ?? 0)
                        )}
                      </div>
                      <div
                        className="absolute -top-0.5 h-2 w-2 -translate-x-1/2 rounded-full bg-white"
                        style={{ left: `${(hoverPercentMap.get(it.id) ?? 0) * 100}%` }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Overlay UI */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex items-center justify-between">
                {/* Author pill */}
                <AuthorBadge authorId={it.author_id} />
                {isVideo ? (
                  <div className="pointer-events-auto flex gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                      aria-label="Report"
                      onClick={() => openReportFor(it.id)}
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                          aria-label="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem onClick={() => handleShare(it.id)}>
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(it.id, true)}>
                          Copy link with timestamp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => shareToTelegram(it.id)}>
                          Share to Telegram
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareToX(it.id)}>
                          Share to X
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}
              </div>
              <div className="pointer-events-auto flex items-center justify-between gap-2">
                <div className="rounded-xl bg-black/40 p-3 text-white max-w-[70%]">
                  <div className="text-sm opacity-90">
                    {new Date(it.created_at).toLocaleString()}
                  </div>
                  {it.content ? (
                    <div className="mt-1 max-w-xl whitespace-pre-wrap text-sm">{it.content}</div>
                  ) : null}
                  <button
                    className="mt-1 block w-full truncate text-left text-xs text-white/90 hover:underline"
                    onClick={() => {
                      setCommentsPostId(it.id)
                      setCommentsOpen(true)
                    }}
                  >
                    {lastCommentMap.get(it.id)
                      ? `${lastCommentMap.get(it.id)!.author ? `${lastCommentMap.get(it.id)!.author}: ` : ''}${lastCommentMap.get(it.id)!.content}`
                      : 'No comments yet — write one'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => toggleLike(it.id)}>
                    <ThumbsUp className="mr-1 h-4 w-4" /> {likesMap.get(it.id) ?? it.likes_count}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCommentsPostId(it.id)
                      setCommentsOpen(true)
                    }}
                  >
                    <MessageCircle className="mr-1 h-4 w-4" /> {it.comments_count}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleShare(it.id)}>
                    <Share2 className="mr-1 h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Inline comments preview removed (moved into overlay footer) */}
          </div>
        )
      })}
      <CommentsDialog
        postId={commentsPostId || ''}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        viewerId={viewerId}
      />
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report content</DialogTitle>
            <DialogDescription>Select a reason and optionally add a note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {(['spam', 'nsfw', 'abuse', 'other'] as ReportReason[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReportReason(r)}
                  className={`rounded-full border px-3 py-1 text-sm ${reportReason === r ? 'bg-primary text-white' : 'bg-transparent'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="report-note">Note</Label>
              <Textarea
                id="report-note"
                placeholder="Optional note"
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setReportOpen(false)}
              disabled={reportSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={reportSubmitting || !reportPostId}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

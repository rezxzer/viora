'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { fetchReactionStats } from '@/lib/reactions'

type CommentRow = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  parent_id?: string | null
}

type ProfileLite = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

type Props = {
  postId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  viewerId: string | null
  onCommentAdded?: () => void
  postAuthorId?: string | null
}

export default function CommentsDialog({
  postId,
  open,
  onOpenChange,
  viewerId,
  onCommentAdded,
  postAuthorId = null,
}: Props) {
  const supabase = supabaseBrowserClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CommentRow[]>([])
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map())
  const [value, setValue] = useState('')
  const firstLoadRef = useRef(false)
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null)
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [stickToBottom, setStickToBottom] = useState(true)
  const COOLDOWN_MS = 8000
  const [lastSentAt, setLastSentAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState<number>(Date.now())
  const [blockMap, setBlockMap] = useState<Map<string, { expires_at: string | null }>>(new Map())
  const [viewerBlocked, setViewerBlocked] = useState<boolean>(false)

  const scrollToBottom = () => {
    if (!listRef.current) return
    requestAnimationFrame(() => {
      if (!listRef.current) return
      listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  type ReactionState = {
    counts: Record<string, number>
    mine: Set<string>
  }
  const [reactions, setReactions] = useState<Map<string, ReactionState>>(new Map())
  const [paidStats, setPaidStats] = useState<
    Map<string, { viora_count: number; viora_amount_cents: number }>
  >(new Map())
  const [vioraPriceCents, setVioraPriceCents] = useState<number | null>(null)
  const previewChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, post_id, author_id, content, created_at, parent_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      const list = (data ?? []) as CommentRow[]
      setRows(list)
      const authorIds = Array.from(new Set(list.map((r) => r.author_id)))
      if (authorIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', authorIds)
        if (!pErr) {
          const map = new Map<string, ProfileLite>()
          ;(profs ?? []).forEach((p) => map.set(p.id, p as ProfileLite))
          setProfiles(map)
        }

        // Load existing blocks if current viewer is the post author
        if (postAuthorId && viewerId === postAuthorId) {
          const { data: blocks } = await supabase
            .from('user_blocks')
            .select('blocked_id, expires_at')
            .eq('blocker_id', postAuthorId)
          const bmap = new Map<string, { expires_at: string | null }>()
          ;(blocks ?? []).forEach((b: { blocked_id: string; expires_at: string | null }) =>
            bmap.set(b.blocked_id, { expires_at: b.expires_at })
          )
          setBlockMap(bmap)
        } else {
          setBlockMap(new Map())
        }
      }

      // Load reactions for these comments
      const commentIds = list.map((r) => r.id)
      try {
        if (commentIds.length) {
          const { data: reacts } = await supabase
            .from('post_comment_reactions')
            .select('comment_id, emoji, user_id')
            .in('comment_id', commentIds)
          const map = new Map<string, ReactionState>()
          ;(reacts ?? []).forEach((r: { comment_id: string; emoji: string; user_id: string }) => {
            const state = map.get(r.comment_id) ?? { counts: {}, mine: new Set<string>() }
            state.counts[r.emoji] = (state.counts[r.emoji] ?? 0) + 1
            if (viewerId && r.user_id === viewerId) state.mine.add(r.emoji)
            map.set(r.comment_id, state)
          })
          setReactions(map)
        } else {
          setReactions(new Map())
        }
      } catch {
        setReactions(new Map())
      }

      // Load paid stats and price
      try {
        if (commentIds.length) {
          console.log('Loading reaction stats for comment IDs:', commentIds)
          const stats = await fetchReactionStats(commentIds)
          console.log('Received reaction stats:', stats)

          const sMap = new Map<string, { viora_count: number; viora_amount_cents: number }>()
          ;(stats ?? []).forEach(
            (s: { comment_id: string; viora_count: number; viora_amount_cents: number }) => {
              sMap.set(s.comment_id, {
                viora_count: s.viora_count ?? 0,
                viora_amount_cents: s.viora_amount_cents ?? 0,
              })
            }
          )
          setPaidStats(sMap)
          console.log('Set paid stats map:', sMap)
        } else {
          setPaidStats(new Map())
        }
      } catch (error) {
        console.error('Error loading reaction stats:', error)
        setPaidStats(new Map())
      }

      try {
        if (vioraPriceCents === null) {
          const { data: rt } = await supabase
            .from('reaction_types')
            .select('code, default_price_cents')
            .eq('code', 'VIORA')
            .maybeSingle()
          setVioraPriceCents((rt?.default_price_cents ?? 100) as number)
        }
      } catch {
        setVioraPriceCents(100)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load comments'
      toast.error(msg)
    } finally {
      setLoading(false)
      // After initial load, ensure we are at bottom
      scrollToBottom()
    }
  }

  useEffect(() => {
    if (open && !firstLoadRef.current) {
      firstLoadRef.current = true
      void load()
    }
  }, [open])

  // Reload when postId changes
  useEffect(() => {
    // reset cached state and ref
    firstLoadRef.current = false
    setRows([])
    setProfiles(new Map())
    setReactions(new Map())
    setPaidStats(new Map())
    if (open) {
      firstLoadRef.current = true
      void load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  // Check if the current viewer is blocked by the post author (via RPC fallback-friendly)
  useEffect(() => {
    const check = async () => {
      try {
        if (!open || !viewerId || !postAuthorId || viewerId === postAuthorId) {
          setViewerBlocked(false)
          return
        }
        // Prefer RPC which can run as security definer and bypass RLS
        let blocked: boolean | null = null
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('is_blocked', {
            blocker_id: postAuthorId,
            blocked_id: viewerId,
          } as Record<string, string>)
          if (!rpcErr && typeof rpcData === 'boolean') blocked = rpcData as boolean
        } catch {}
        if (blocked === null) {
          // Fallback to direct select (may be denied by RLS for non-owner viewers)
          const { data } = await supabase
            .from('user_blocks')
            .select('expires_at')
            .eq('blocker_id', postAuthorId)
            .eq('blocked_id', viewerId)
            .maybeSingle()
          if (!data) {
            setViewerBlocked(false)
            return
          }
          const exp = (data as { expires_at: string | null }).expires_at
          if (!exp) {
            setViewerBlocked(true)
          } else {
            setViewerBlocked(new Date(exp).getTime() > Date.now())
          }
        } else {
          setViewerBlocked(blocked)
        }
      } catch {
        setViewerBlocked(false)
      }
    }
    void check()
  }, [open, viewerId, postAuthorId, supabase])

  // Realtime live updates while dialog is open
  useEffect(() => {
    if (!open) return
    const ch = supabase
      .channel(`comments-live:${postId}`)
      // Comments CRUD
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as CommentRow
            setRows((prev) => (prev.find((r) => r.id === row.id) ? prev : [...prev, row]))
            // Auto-scroll if user is pinned to bottom
            if (stickToBottom && listRef.current) {
              requestAnimationFrame(() => {
                listRef.current!.scrollTop = listRef.current!.scrollHeight
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as CommentRow
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, content: row.content } : r))
            )
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as { id: string } as CommentRow
            setRows((prev) => prev.filter((r) => r.id !== row.id))
          }
        }
      )
      // Emoji reactions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comment_reactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as { comment_id: string; emoji: string; user_id: string }
            setReactions((prev) => {
              const current = new Map(prev)
              const state = current.get(row.comment_id) ?? { counts: {}, mine: new Set<string>() }
              state.counts[row.emoji] = (state.counts[row.emoji] ?? 0) + 1
              if (viewerId && row.user_id === viewerId) state.mine.add(row.emoji)
              current.set(row.comment_id, {
                counts: { ...state.counts },
                mine: new Set(state.mine),
              })
              return current
            })
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as { comment_id: string; emoji: string; user_id: string }
            setReactions((prev) => {
              const current = new Map(prev)
              const state = current.get(row.comment_id) ?? { counts: {}, mine: new Set<string>() }
              state.counts[row.emoji] = Math.max(0, (state.counts[row.emoji] ?? 0) - 1)
              if (viewerId && row.user_id === viewerId) state.mine.delete(row.emoji)
              current.set(row.comment_id, {
                counts: { ...state.counts },
                mine: new Set(state.mine),
              })
              return current
            })
          }
        }
      )
      // Paid reactions (VIORA)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comment_paid_reactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as {
              comment_id: string
              reaction_code: string
              amount_cents: number
            }
            if (row.reaction_code !== 'VIORA') return
            setPaidStats((prev) => {
              const m = new Map(prev)
              const cur = m.get(row.comment_id) ?? { viora_count: 0, viora_amount_cents: 0 }
              m.set(row.comment_id, {
                viora_count: cur.viora_count + 1,
                viora_amount_cents: cur.viora_amount_cents + (row.amount_cents || 0),
              })
              return m
            })
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as {
              comment_id: string
              reaction_code: string
              amount_cents: number
            }
            if (row.reaction_code !== 'VIORA') return
            setPaidStats((prev) => {
              const m = new Map(prev)
              const cur = m.get(row.comment_id) ?? { viora_count: 0, viora_amount_cents: 0 }
              m.set(row.comment_id, {
                viora_count: Math.max(0, cur.viora_count - 1),
                viora_amount_cents: Math.max(0, cur.viora_amount_cents - (row.amount_cents || 0)),
              })
              return m
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [open, postId, viewerId, supabase])

  // When rows grow and user is pinned to bottom, keep it stuck
  useEffect(() => {
    if (!open) return
    if (stickToBottom) scrollToBottom()
  }, [rows.length, open])

  // Soft ticker for cooldown UI (future progress indicator)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  const onSubmit = () => {
    if (!viewerId) {
      toast.info('Sign in to comment')
      return
    }
    const content = value.trim()
    if (!content) return
    if (lastSentAt && Date.now() - lastSentAt < COOLDOWN_MS) {
      const remain = Math.ceil((COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000)
      toast.info(`Wait ${remain}s before sending again`)
      return
    }
    const links = (content.match(/https?:\/\//gi) || []).length
    if (links > 2) {
      toast.error('Too many links in one comment')
      return
    }
    startTransition(async () => {
      try {
        // optimistic row
        const tempId = `temp_${Date.now()}`
        const optimistic: CommentRow = {
          id: tempId,
          post_id: postId,
          author_id: viewerId,
          content,
          created_at: new Date().toISOString(),
          parent_id: replyTo?.id ?? null,
        }
        setRows((prev) => [...prev, optimistic])
        setValue('')
        setReplyTo(null)
        // Keep scroll pinned when you send a new comment
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
          }
        })

        const { data, error } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            author_id: viewerId,
            content,
            parent_id: optimistic.parent_id,
          })
          .select('id, post_id, author_id, content, created_at, parent_id')
          .single()
        if (error) throw error
        setRows((prev) => prev.map((r) => (r.id === tempId ? (data as CommentRow) : r)))
        setLastSentAt(Date.now())
        onCommentAdded?.()
      } catch (e) {
        let msg = 'Failed to comment'
        if (e && typeof e === 'object' && 'message' in (e as Record<string, unknown>)) {
          const mm = (e as { message?: unknown }).message
          if (typeof mm === 'string' && mm.trim().length > 0) msg = mm
        }
        toast.error(msg)
        // rollback last optimistic row
        setRows((prev) => prev.slice(0, -1))
      }
    })
  }

  const EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'] as const

  const blockUser = async (targetUserId: string, duration: '24h' | '7d' | '30d' | 'permanent') => {
    if (!postAuthorId || viewerId !== postAuthorId) return
    let expires: string | null = null
    if (duration !== 'permanent') {
      const now = new Date()
      const add = duration === '24h' ? 24 : duration === '7d' ? 24 * 7 : 24 * 30
      now.setHours(now.getHours() + add)
      expires = now.toISOString()
    }
    try {
      const { error } = await supabase
        .from('user_blocks')
        .upsert(
          { blocker_id: postAuthorId, blocked_id: targetUserId, expires_at: expires },
          { onConflict: 'blocker_id,blocked_id' }
        )
      if (error) throw error
      setBlockMap((prev) => new Map(prev).set(targetUserId, { expires_at: expires }))
      toast.success('User blocked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to block')
    }
  }

  const unblockUser = async (targetUserId: string) => {
    if (!postAuthorId || viewerId !== postAuthorId) return
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', postAuthorId)
        .eq('blocked_id', targetUserId)
      if (error) throw error
      setBlockMap((prev) => {
        const m = new Map(prev)
        m.delete(targetUserId)
        return m
      })
      toast.success('Unblocked')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unblock')
    }
  }

  const toggleReaction = async (commentId: string, emoji: string) => {
    if (!viewerId) {
      toast.info('Sign in to react')
      return
    }
    const state = reactions.get(commentId) ?? { counts: {}, mine: new Set<string>() }
    const has = state.mine.has(emoji)
    // optimistic
    const next: ReactionState = {
      counts: {
        ...state.counts,
        [emoji]: Math.max(0, (state.counts[emoji] ?? 0) + (has ? -1 : 1)),
      },
      mine: new Set(
        Array.from(state.mine.values())
          .filter((e) => e !== emoji)
          .concat(has ? [] : [emoji])
      ),
    }
    setReactions((prev) => new Map(prev).set(commentId, next))
    try {
      if (has) {
        const { error } = await supabase
          .from('post_comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', viewerId)
          .eq('emoji', emoji)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('post_comment_reactions')
          .insert({ comment_id: commentId, user_id: viewerId, emoji })
        if (error) throw error
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to react')
      // revert on error by reloading this comment's reactions
      try {
        const { data: reacts } = await supabase
          .from('post_comment_reactions')
          .select('comment_id, emoji, user_id')
          .eq('comment_id', commentId)
        const stateReload: ReactionState = { counts: {}, mine: new Set<string>() }
        ;(reacts ?? []).forEach((r: { emoji: string; user_id: string }) => {
          stateReload.counts[r.emoji] = (stateReload.counts[r.emoji] ?? 0) + 1
          if (viewerId && r.user_id === viewerId) stateReload.mine.add(r.emoji)
        })
        setReactions((prev) => new Map(prev).set(commentId, stateReload))
      } catch {}
    }
  }

  const sendViora = async (commentId: string) => {
    if (!viewerId) {
      toast.info('Sign in to react')
      return
    }
    const price = vioraPriceCents ?? 100
    try {
      const res = await fetch('/api/payments/viora/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, amountCents: price, buyerId: viewerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create checkout')
      const url = data.url as string | undefined
      if (url) {
        toast.message('Redirecting to payment…')
        try {
          window.location.assign(url)
        } finally {
          // hard fallback in case SPA navigation is blocked
          setTimeout(() => {
            // create an anchor to force navigation reliably
            const a = document.createElement('a')
            a.href = url
            a.rel = 'nofollow'
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
              // ultimate fallback
              ;(window as unknown as { location: Location }).location = url as unknown as Location
            }, 200)
          }, 50)
        }
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start checkout')
    }
  }

  const startEdit = (row: CommentRow) => {
    setEditing({ id: row.id, value: row.content })
  }

  const cancelEdit = () => setEditing(null)

  const saveEdit = async () => {
    if (!editing) return
    const newContent = editing.value.trim()
    if (!newContent) return
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: newContent })
        .eq('id', editing.id)
      if (error) throw error
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, content: newContent } : r)))
      setEditing(null)
      toast.success('Updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    }
  }

  const removeComment = async (row: CommentRow) => {
    const allowed = viewerId === row.author_id || (postAuthorId && viewerId === postAuthorId)
    if (!allowed) return
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this comment?') : true
    if (!ok) return
    try {
      const { error } = await supabase.from('comments').delete().eq('id', row.id)
      if (error) throw error
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      toast.success('Deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const rendered = useMemo(() => {
    // Build two-level thread: parents then children
    const parentRows = rows.filter((r) => !r.parent_id)
    const childrenMap = new Map<string, CommentRow[]>()
    rows.forEach((r) => {
      if (r.parent_id) {
        const arr = childrenMap.get(r.parent_id) ?? []
        arr.push(r)
        childrenMap.set(r.parent_id, arr)
      }
    })

    const renderOne = (r: CommentRow, depth: number) => {
      const p = profiles.get(r.author_id)
      const name = p?.full_name || p?.username || 'User'
      const react = reactions.get(r.id) ?? { counts: {}, mine: new Set<string>() }
      const paid = paidStats.get(r.id) ?? { viora_count: 0, viora_amount_cents: 0 }
      const canEdit = viewerId === r.author_id
      const canDelete = canEdit || (postAuthorId && viewerId === postAuthorId)
      const canModerate = postAuthorId && viewerId === postAuthorId && r.author_id !== postAuthorId
      const blockedInfo = blockMap.get(r.author_id) || null
      return (
        <div
          key={r.id}
          className="flex items-start gap-2 py-2"
          style={{ marginLeft: depth ? 28 : 0 }}
        >
          <UserAvatar
            src={p?.avatar_url}
            alt="avatar"
            fallback={p?.full_name || p?.username || 'User'}
            className="h-8 w-8"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span> ·{' '}
              {new Date(r.created_at).toLocaleString()}
            </div>
            {editing?.id === r.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editing.value}
                  onChange={(e) => setEditing({ id: r.id, value: e.target.value })}
                  className="min-h-16"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm break-words">{r.content}</div>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                className={`px-2 h-7 rounded-full transition-transform duration-150 active:scale-95 ${react.mine.has('👍') ? 'bg-secondary/90 text-foreground shadow' : 'bg-white/5 text-foreground/90 hover:bg-white/10'}`}
                onClick={() => toggleReaction(r.id, '👍')}
              >
                👍 {react.counts['👍'] ?? 0}
              </button>
              <div className="relative">
                {EMOJIS.slice(1).map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`px-2 h-7 rounded-full ml-1 transition-transform duration-150 active:scale-95 ${react.mine.has(e) ? 'bg-secondary/90 text-foreground shadow' : 'bg-white/5 text-foreground/90 hover:bg-white/10'}`}
                    onClick={() => toggleReaction(r.id, e)}
                    aria-label={`React ${e}`}
                  >
                    {e} {react.counts[e] ?? 0}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="relative px-2 h-7 rounded-full ml-1 text-foreground transition-colors duration-150 active:scale-95 border border-violet-500/40 bg-white/5 hover:bg-violet-500/10"
                onClick={() => sendViora(r.id)}
                aria-label="Send Viora"
                title="Send Viora"
              >
                {/* Minimal VIORA monogram */}
                <svg
                  viewBox="0 0 24 24"
                  className="inline h-4 w-4 align-[-2px] mr-1"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="vioraGrad" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="url(#vioraGrad)"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M7.5 8l4.5 8 4.5-8"
                    fill="none"
                    stroke="url(#vioraGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {paid.viora_count}
              </button>
              {!viewerBlocked && (
                <button
                  type="button"
                  className="px-2 py-0.5 rounded hover:bg-elev"
                  onClick={() => setReplyTo(r)}
                >
                  Reply
                </button>
              )}
              {canEdit ? (
                <button
                  type="button"
                  className="px-2 py-0.5 rounded hover:bg-elev"
                  onClick={() => startEdit(r)}
                >
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  className="px-2 py-0.5 rounded hover:bg-elev text-red-400"
                  onClick={() => removeComment(r)}
                >
                  Delete
                </button>
              ) : null}
              {canModerate ? (
                blockedInfo ? (
                  <>
                    <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                      Blocked
                    </span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded hover:bg-elev"
                      onClick={() => unblockUser(r.author_id)}
                    >
                      Unblock
                    </button>
                  </>
                ) : (
                  <div className="relative inline-flex items-center gap-1">
                    <span>Block:</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded hover:bg-elev"
                      onClick={() => blockUser(r.author_id, '24h')}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded hover:bg-elev"
                      onClick={() => blockUser(r.author_id, '7d')}
                    >
                      7d
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded hover:bg-elev"
                      onClick={() => blockUser(r.author_id, '30d')}
                    >
                      30d
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded hover:bg-elev text-red-300"
                      onClick={() => blockUser(r.author_id, 'permanent')}
                    >
                      Permanent
                    </button>
                  </div>
                )
              ) : null}
            </div>
            {childrenMap.get(r.id)?.map((child) => renderOne(child, depth + 1))}
          </div>
        </div>
      )
    }

    return parentRows.map((r) => renderOne(r, 0))
  }, [rows, profiles, reactions])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto pr-2"
          onScroll={(e) => {
            const el = e.currentTarget as HTMLDivElement
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120
            setStickToBottom(nearBottom)
          }}
        >
          {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : rendered}
          {rows.length === 0 && !loading ? (
            <div className="text-sm text-muted-foreground">No comments yet</div>
          ) : null}
        </div>
        {replyTo ? (
          <div className="text-xs text-muted-foreground -mt-1">
            Replying to{' '}
            <span className="font-medium text-foreground">
              {profiles.get(replyTo.author_id)?.full_name ||
                profiles.get(replyTo.author_id)?.username ||
                'User'}
            </span>
            <button className="ml-2 underline" onClick={() => setReplyTo(null)}>
              cancel
            </button>
          </div>
        ) : null}
        {viewerBlocked ? (
          <div className="mt-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            You’re blocked by the author and cannot comment on this post.
          </div>
        ) : (
          <div className="mt-2 flex items-end gap-2">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Write a comment…"
              className="min-h-10 resize-none"
              maxLength={2000}
            />
            <Button onClick={onSubmit} disabled={isPending || !value.trim()}>
              Send
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

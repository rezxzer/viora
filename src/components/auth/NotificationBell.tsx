'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowserClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type NotificationRow = {
  id: number
  user_id: string
  type: 'like' | 'comment' | 'follow'
  actor_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
  read_at: string | null
  actor_name?: string | null
  actor_avatar?: string | null
  actor_username?: string | null
}

export default function NotificationBell() {
  const supabase = supabaseBrowserClient()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null))
  }, [supabase])

  const load = async () => {
    if (!uid) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, actor_id, post_id, comment_id, created_at, read_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    setLoading(false)
    if (error) return
    const base = (data as NotificationRow[]) || []
    const enriched = await enrichWithActors(base)
    setRows(enriched)
  }

  useEffect(() => {
    if (!open) return
    void load()
  }, [open, uid])

  // Auto mark-as-read when panel is opened and items are loaded
  useEffect(() => {
    if (!open) return
    if (rows.length === 0) return
    if (rows.some((r) => !r.read_at)) {
      void markRead()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rows])

  // Realtime: listen for new notifications for this user
  useEffect(() => {
    if (!uid) return
    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        async (payload) => {
          const newRow = payload.new as NotificationRow
          const [enriched] = await enrichWithActors([newRow])
          setRows((prev) => [enriched, ...prev].slice(0, 50))
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [uid])

  const enrichWithActors = async (items: NotificationRow[]): Promise<NotificationRow[]> => {
    const uniqueActorIds = Array.from(new Set(items.map((i) => i.actor_id)))
    if (uniqueActorIds.length === 0) return items
    const { data: actors, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', uniqueActorIds)
    if (error || !actors) return items
    const byId = new Map<
      string,
      { id: string; username: string | null; full_name: string | null; avatar_url: string | null }
    >()
    ;(
      actors as Array<{
        id: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
      }>
    ).forEach((a) => {
      byId.set(a.id, {
        id: a.id,
        username: a.username ?? null,
        full_name: a.full_name ?? null,
        avatar_url: a.avatar_url ?? null,
      })
    })
    return items.map((i) => {
      const a = byId.get(i.actor_id)
      return {
        ...i,
        actor_username: a?.username ?? null,
        actor_name: a?.full_name ?? null,
        actor_avatar: a?.avatar_url ?? null,
      }
    })
  }

  const unread = useMemo(() => rows.filter((r) => !r.read_at).length, [rows])

  const markRead = async () => {
    if (!uid) return
    const unreadIds = rows.filter((r) => !r.read_at).map((r) => r.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .eq('user_id', uid)
    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.read_at ? r : { ...r, read_at: new Date().toISOString() }))
      )
    }
  }

  const labelFor = (r: NotificationRow) => {
    if (r.type === 'like') return 'liked your post'
    if (r.type === 'comment') return 'commented on your post'
    return 'started following you'
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant={unread ? 'default' : 'outline'}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        {unread > 0 ? `Notifications (${unread})` : 'Notifications'}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-surface p-2 shadow-soft z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Notifications</div>
            <button className="text-xs underline" onClick={markRead} disabled={unread === 0}>
              Mark all read
            </button>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No notifications</div>
          ) : (
            <ul className="max-h-80 overflow-auto space-y-1">
              {rows.map((r) => (
                <li key={r.id} className={`rounded-lg p-2 ${r.read_at ? 'opacity-70' : 'bg-elev'}`}>
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={r.actor_avatar ?? undefined}
                        alt={r.actor_name ?? r.actor_username ?? 'user'}
                      />
                      <AvatarFallback>
                        {(r.actor_username ?? 'U').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm">
                        {r.actor_username ? (
                          <Link
                            href={`/u/${r.actor_username}`}
                            className="font-medium hover:underline"
                          >
                            {r.actor_name ?? `@${r.actor_username}`}
                          </Link>
                        ) : (
                          <span className="font-medium">Someone</span>
                        )}{' '}
                        {labelFor(r)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { StreamStatus } from '@/types/streams'

export type Visibility = 'public' | 'subscribers' | 'private'

export async function getStreamWithLastSession(streamId: string) {
  const supabase = await createSupabaseServerClient()

  // Get the stream with creator profile using stream_details_v1 view
  const { data: stream, error: se } = await supabase
    .from('stream_details_v1')
    .select('*')
    .eq('id', streamId)
    .single()
  if (se || !stream) throw se ?? new Error('Stream not found')

  // Profile is already included in the view
  const profile = {
    id: stream.user_id,
    username: stream.creator_username,
    full_name: null, // not included in stream_details_v1
    avatar_url: stream.creator_avatar_url,
  }

  // Get the last session
  const { data: sessions, error: sse } = await supabase
    .from('stream_sessions')
    .select('*')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (sse) throw sse

  // Transform the data to match the expected format
  const transformedStream = {
    ...stream,
    creator: {
      id: profile?.id || stream.user_id,
      username: profile?.username || 'Unknown',
      avatarUrl: profile?.avatar_url || undefined,
    },
  }

  return {
    stream: transformedStream,
    session: sessions?.[0] ?? null,
    creatorProfile: profile,
  }
}

export async function getPublicStreams(options?: { limit?: number; cursor?: string }) {
  const supabase = await createSupabaseServerClient()
  const { limit = 12, cursor } = options || {}

  let query = supabase
    .from('streams')
    .select(
      `
      *,
      stream_sessions!inner(*),
      profiles!streams_creator_id_fkey(id, username, full_name, avatar_url)
    `
    )
    .eq('visibility', 'public')
    .eq('status', 'live')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('started_at', cursor)
  }

  const { data: streams, error } = await query

  if (error) throw error
  return streams || []
}

// Helper for updating stream session status
export async function upsertSessionStatus(opts: {
  streamId: string
  nextStatus: 'idle' | 'live' | 'ended'
}) {
  const { streamId, nextStatus } = opts
  const supabase = await createSupabaseServerClient()

  // 1) Find the last session for the given streamId
  const { data: last, error: lastErr } = await supabase
    .from('stream_sessions')
    .select('*')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastErr) throw lastErr

  // 2) If no last session or it's 'ended' → create new row with status=nextStatus
  if (!last || last.status === 'ended') {
    const payload: Record<string, string | Date> = {
      stream_id: streamId,
      status: nextStatus,
    }
    if (nextStatus === 'live') payload.started_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('stream_sessions')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  // 3) Otherwise, update the same row
  const patch: Record<string, string | Date> = { status: nextStatus }
  if (nextStatus === 'live' && !last.started_at) patch.started_at = new Date().toISOString()
  if (nextStatus === 'ended' && !last.ended_at) patch.ended_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('stream_sessions')
    .update(patch)
    .eq('id', last.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Service role version for admin operations
export async function upsertSessionStatusWithService(opts: {
  supabase: ReturnType<typeof import('@/lib/supabase-server').getServiceSupabase>
  streamId: string
  nextStatus: 'idle' | 'live' | 'ended'
}) {
  const { supabase, streamId, nextStatus } = opts

  // 1) Find the last session for the given streamId
  const { data: last, error: lastErr } = await supabase
    .from('stream_sessions')
    .select('*')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastErr) throw lastErr

  // 2) If no last session or it's 'ended' → create new row with status=nextStatus
  if (!last || last.status === 'ended') {
    const payload: Record<string, string | Date> = {
      stream_id: streamId,
      status: nextStatus,
    }
    if (nextStatus === 'live') payload.started_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('stream_sessions')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  // 3) Otherwise, update the same row
  const patch: Record<string, string | Date> = { status: nextStatus }
  if (nextStatus === 'live' && !last.started_at) patch.started_at = new Date().toISOString()
  if (nextStatus === 'ended' && !last.ended_at) patch.ended_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('stream_sessions')
    .update(patch)
    .eq('id', last.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Helper for fetching creator public profile
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCreatorPublicProfile(client: any, creatorId: string) {
  // server-side usage only
  const { data, error } = await client
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .eq('id', creatorId)
    .single()

  if (error) return null
  return data
}

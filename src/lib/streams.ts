import { createSupabaseServerClient } from '@/lib/supabase-server'

export type StreamStatus = 'idle' | 'live' | 'ended'
export type Visibility = 'public' | 'subscribers' | 'private'

export async function getStreamWithLastSession(streamId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: stream, error: se } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single()
  if (se || !stream) throw se ?? new Error('Stream not found')

  const { data: sessions, error: sse } = await supabase
    .from('stream_sessions')
    .select('*')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (sse) throw sse

  return { stream, session: sessions?.[0] ?? null }
}

export async function getPublicStreams() {
  const supabase = await createSupabaseServerClient()
  const { data: streams, error } = await supabase
    .from('streams')
    .select(
      `
      *,
      stream_sessions!inner(*)
    `
    )
    .eq('visibility', 'public')
    .eq('status', 'live')
    .order('started_at', { ascending: false })

  if (error) throw error
  return streams || []
}

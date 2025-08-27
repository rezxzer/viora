import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json().catch(() => ({}))
  const { title = 'Untitled Stream', visibility = 'public' } = body

  const { data: profile, error: pe } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (pe || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1) create stream
  const { data: stream, error: se } = await supabase
    .from('streams')
    .insert({
      creator_id: profile.id,
      title,
      visibility,
      status: 'idle',
    })
    .select('*')
    .single()
  if (se) return NextResponse.json({ error: se.message }, { status: 400 })

  // 2) mock session (no provider call yet)
  const { data: session, error: sse } = await supabase
    .from('stream_sessions')
    .insert({
      stream_id: stream.id,
      provider: 'mux',
      ingest_url: null,
      rtmp_key: null,
      hls_url: null,
    })
    .select('*')
    .single()
  if (sse) return NextResponse.json({ error: sse.message }, { status: 400 })

  return NextResponse.json({ stream, session })
}

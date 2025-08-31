import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    // Get authenticated user
    const { data: au } = await supabase.auth.getUser()
    const authedId = au?.user?.id ?? null

    // Fetch stream data using new view
    const { data: streamData, error: streamError } = await supabase
      .from('stream_details_v1')
      .select('*')
      .eq('id', id)
      .single()

    if (streamError) {
      console.error('Stream fetch error:', streamError)
      if (streamError.code === 'PGRST116') {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }

    if (!streamData) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Transform data for response using new schema
    const stream = {
      id: streamData.id,
      title: streamData.title,
      description: streamData.description,
      status: streamData.status,
      is_live: streamData.is_live,
      playback_url: streamData.playback_url,
      mux_stream_key: streamData.mux_stream_key,
      viewers_count: streamData.viewers_count || 0,
      started_at: streamData.started_at,
      ended_at: streamData.ended_at,
      created_at: streamData.created_at,
    }

    const creator_profile = {
      id: streamData.user_id,
      username: streamData.creator_username,
      avatar_url: streamData.creator_avatar_url,
    }

    // owner-only RTMP
    let rtmp: { server: string; stream_key: string | null } | null = null
    if (authedId && authedId === streamData.user_id) {
      rtmp = {
        server: 'rtmps://global-live.mux.com:443/app',
        stream_key: streamData.mux_stream_key ?? null,
      }
    }

    return NextResponse.json({
      stream,
      creator_profile,
      rtmp,
    })
  } catch (error) {
    console.error('API Error in /api/streams/[id]:', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

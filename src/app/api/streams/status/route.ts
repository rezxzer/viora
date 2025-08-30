import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, getServiceSupabase } from '@/lib/supabaseServer'

// Updated to match the new StreamStatus type
const allowed = new Set([
  'idle',
  'active',
  'ended',
  'errored',
  'disabled',
  'recording',
  'processing',
])

interface StreamUpdateData {
  status: string
  started_at?: string | null
  ended_at?: string | null
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Stream ID required' }, { status: 400 })
    }

    const service = getServiceSupabase()

    // Get current stream status
    const { data: stream, error } = await service
      .from('streams')
      .select('id, status, is_live, last_status_at, mux_live_stream_id, viewers_count')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })

    return NextResponse.json(
      {
        status: stream.status,
        is_live: stream.is_live,
        last_status_at: stream.last_status_at,
        mux_live_stream_id: stream.mux_live_stream_id,
        viewers_count: stream.viewers_count || 0,
      },
      { status: 200 }
    )
  } catch (e: unknown) {
    console.error('get status failed:', e)
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json()

    if (!id || !allowed.has(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const user = await getServerUser()
    const service = getServiceSupabase()

    // Verify ownership
    const { data: stream, error: fetchErr } = await service
      .from('streams')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr
    if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    if (stream.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update stream status with proper timestamp handling
    const updateData: StreamUpdateData = { status }

    if (status === 'active') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'ended') {
      updateData.ended_at = new Date().toISOString()
    }

    const { error: updErr } = await service.from('streams').update(updateData).eq('id', id)

    if (updErr) throw updErr

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: unknown) {
    console.error('update status failed:', e)
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    const errorStatus = (e as { status?: number })?.status ?? 500
    return NextResponse.json({ error: errorMessage, details: e }, { status: errorStatus })
  }
}

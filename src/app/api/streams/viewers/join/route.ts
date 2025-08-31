import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { streamId, token } = await req.json()

    if (!streamId || !token) {
      return NextResponse.json({ error: 'Missing streamId or token' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Insert viewer record (ON CONFLICT DO NOTHING)
    const { data: viewer, error: viewerError } = await supabase
      .from('stream_viewers')
      .insert({
        stream_id: streamId,
        viewer_token: token,
      })
      .select()
      .single()

    if (viewerError && viewerError.code !== '23505') {
      // 23505 = unique_violation
      console.error('Error inserting viewer:', viewerError)
      return NextResponse.json({ error: 'Failed to join stream' }, { status: 500 })
    }

    // If new viewer was added, increment count
    if (viewer) {
      // First get current count
      const { data: currentStream, error: countError } = await supabase
        .from('streams')
        .select('viewers_count')
        .eq('id', streamId)
        .single()

      if (countError) {
        console.error('Error getting current viewer count:', countError)
        return NextResponse.json({ error: 'Failed to get viewer count' }, { status: 500 })
      }

      // Then update with incremented count
      const { data: stream, error: updateError } = await supabase
        .from('streams')
        .update({ viewers_count: (currentStream.viewers_count || 0) + 1 })
        .eq('id', streamId)
        .select('viewers_count')
        .single()

      if (updateError) {
        console.error('Error updating viewer count:', updateError)
        return NextResponse.json({ error: 'Failed to update viewer count' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, viewers: stream.viewers_count })
    }

    // If viewer already exists, just return current count
    const { data: stream, error: countError } = await supabase
      .from('streams')
      .select('viewers_count')
      .eq('id', streamId)
      .single()

    if (countError) {
      console.error('Error getting viewer count:', countError)
      return NextResponse.json({ error: 'Failed to get viewer count' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, viewers: stream.viewers_count })
  } catch (error) {
    console.error('Viewer join error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

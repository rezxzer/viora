import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { streamId, token } = await req.json()

    if (!streamId || !token) {
      return NextResponse.json({ error: 'Missing streamId or token' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // First check if viewer exists
    const { data: existingViewer, error: checkError } = await supabase
      .from('stream_viewers')
      .select('stream_id, viewer_token')
      .eq('stream_id', streamId)
      .eq('viewer_token', token)
      .single()

    if (checkError) {
      console.error('Error checking viewer existence:', checkError)
      return NextResponse.json({ error: 'Viewer not found' }, { status: 404 })
    }

    if (!existingViewer) {
      // If viewer doesn't exist, just return current count
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
    }

    // Delete viewer record
    const { data: deleted, error: deleteError } = await supabase
      .from('stream_viewers')
      .delete()
      .eq('stream_id', streamId)
      .eq('viewer_token', token)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting viewer:', deleteError)
      return NextResponse.json({ error: 'Failed to leave stream' }, { status: 500 })
    }

    // If viewer was actually deleted, decrement count
    if (deleted) {
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

      // Then update with decremented count
      const { data: stream, error: updateError } = await supabase
        .from('streams')
        .update({ viewers_count: Math.max(0, (currentStream.viewers_count || 0) - 1) })
        .eq('id', streamId)
        .select('viewers_count')
        .single()

      if (updateError) {
        console.error('Error updating viewer count:', updateError)
        return NextResponse.json({ error: 'Failed to update viewer count' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, viewers: stream.viewers_count })
    }

    // If no viewer was deleted, return current count
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
    console.error('Viewer leave error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

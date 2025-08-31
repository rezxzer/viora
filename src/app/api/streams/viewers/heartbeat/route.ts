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
      return NextResponse.json({ error: 'Viewer not found' }, { status: 404 })
    }

    // Update last_seen timestamp
    const { data: updated, error: updateError } = await supabase
      .from('stream_viewers')
      .update({ last_seen: new Date().toISOString() })
      .eq('stream_id', streamId)
      .eq('viewer_token', token)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating heartbeat:', updateError)
      return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Viewer heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { streamId, status } = await req.json().catch(() => ({}))
  if (!streamId || !['idle', 'live', 'ended'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // check ownership
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: stream, error: se } = await supabase
    .from('streams')
    .select('id,creator_id')
    .eq('id', streamId)
    .single()
  if (se || !stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
  if (stream.creator_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const patch: Record<string, string | Date> = { status }
  if (status === 'live') patch.started_at = new Date().toISOString()
  if (status === 'ended') patch.ended_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('streams')
    .update(patch)
    .eq('id', streamId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ stream: data })
}

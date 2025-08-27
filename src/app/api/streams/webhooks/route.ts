import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type MuxEvent =
  | { type: 'video.live_stream.active'; data: { id: string } }
  | { type: 'video.live_stream.idle'; data: { id: string } }
  | { type: string; data: Record<string, unknown> }

export async function POST(req: NextRequest) {
  // TODO: verify signature with MUX_WEBHOOK_SECRET
  const supabase = await createSupabaseServerClient()
  const event = (await req.json()) as MuxEvent

  // Map mux event -> our streams; for now assume data.id maps to stream_sessions or streams via external_id (future)
  // Mock logic for now:
  if (event.type === 'video.live_stream.active') {
    // set any stream to live (demo fallback)
    // In real: find stream by external_id and update it.
    // DO NOT fail if not found (return 200).
    console.log('Mux webhook: live_stream.active', event.data.id)
  }
  if (event.type === 'video.live_stream.idle') {
    // set ended
    console.log('Mux webhook: live_stream.idle', event.data.id)
  }

  return NextResponse.json({ ok: true })
}

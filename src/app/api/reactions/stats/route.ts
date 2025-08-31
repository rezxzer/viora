// src/app/api/reactions/stats/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: use service role on the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // must be set in env
  { auth: { persistSession: false } }
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idsRaw = url.searchParams.get('ids') || ''

    console.log('API: Received request for comment IDs:', idsRaw)

    let ids = idsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s))

    console.log('API: Filtered valid UUIDs:', ids)

    if (ids.length === 0) {
      console.log('API: No valid IDs, returning empty array')
      return NextResponse.json([], { status: 200 })
    }

    if (ids.length > 100) {
      console.log('API: Limiting to 100 IDs')
      ids = ids.slice(0, 100)
    }

    console.log('API: Querying Supabase for IDs:', ids)

    const { data, error } = await supabase
      .from('v_comment_paid_reaction_stats')
      .select('*')
      .in('comment_id', ids)

    if (error) {
      console.error('API: Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('API: Successfully retrieved data:', data?.length || 0, 'records')
    return NextResponse.json(data || [], { status: 200 })
  } catch (err: unknown) {
    console.error('API: Unexpected error:', err)
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

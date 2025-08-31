import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const schema = z.object({ creatorId: z.string().uuid(), planId: z.string().uuid().optional() })

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { creatorId, planId } = parsed.data
  const subscriberId = session.user.id

  const { error } = await supabase.from('subscriptions').insert({
    subscriber_id: subscriberId,
    creator_id: creatorId,
    plan_id: planId ?? null,
    status: 'active',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

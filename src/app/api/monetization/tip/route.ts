import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const schema = z.object({
  creatorId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
})

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { creatorId, amountCents, currency } = parsed.data
  const tipperId = session.user.id

  const { error } = await supabase.from('tips').insert({
    tipper_id: tipperId,
    creator_id: creatorId,
    amount_cents: amountCents,
    currency: currency.toLowerCase(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

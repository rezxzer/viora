import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature')

    // Lazy imports to avoid hard deps when running without Stripe locally
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    type SessionLike = {
      id?: string
      object?: string
      payment_status?: string
      amount_total?: number | null
      currency?: string | null
      metadata?: Record<string, string | undefined> | null
    }

    let session: SessionLike | null = null
    if (!stripeSecret || !webhookSecret || !sig) {
      // Mock mode: accept payload as JSON directly (useful in dev without Stripe)
      try {
        session = JSON.parse(rawBody) as SessionLike
      } catch {
        session = null
      }
    } else {
      const StripeMod = await import('stripe')
      const stripe = new StripeMod.default(stripeSecret)
      let event: Stripe.Event
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid signature'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      if (event.type === 'checkout.session.completed') {
        session = event.data.object as unknown as SessionLike
      } else if (event.type === 'payment_intent.succeeded') {
        // Some setups send PI instead; try to map minimal fields
        const pi =
          (event.data.object as Stripe.PaymentIntent) || ({} as Partial<Stripe.PaymentIntent>)
        session = {
          id: pi.id as string | undefined,
          payment_status: 'paid',
          amount_total:
            typeof pi.amount_received === 'number' ? (pi.amount_received as number) : null,
          currency: typeof pi.currency === 'string' ? (pi.currency as string) : null,
          metadata: (pi.metadata as Record<string, string> | null) || null,
        }
      } else {
        return NextResponse.json({ ok: true })
      }
    }

    if (!session) return NextResponse.json({ error: 'No session' }, { status: 400 })
    const paid = (session.payment_status || '').toLowerCase() === 'paid'
    const metadata = session.metadata || {}
    const reactionCode = (metadata['reaction_code'] || '').toString() || 'VIORA'
    const commentId = (metadata['comment_id'] || '').toString()
    const buyerId = (metadata['buyer_id'] || '').toString() || null
    const currency = (session.currency || metadata['currency'] || 'usd').toString()
    const amountCents = Number(metadata['amount_cents'] || session.amount_total || 0) | 0

    if (!paid || !commentId || amountCents <= 0) {
      return NextResponse.json({ ok: true })
    }

    // Resolve creator_id from comment -> post -> author
    let creatorId: string | null = null
    {
      const { data: comment } = await admin
        .from('post_comments')
        .select('post_id')
        .eq('id', commentId)
        .maybeSingle()
      if (comment?.post_id) {
        const { data: post } = await admin
          .from('posts')
          .select('author_id')
          .eq('id', comment.post_id)
          .maybeSingle()
        creatorId = post?.author_id ?? null
      }
    }

    // Record the paid reaction (primary source of truth for UI)
    await admin.from('post_comment_paid_reactions').insert({
      comment_id: commentId,
      buyer_id: buyerId || crypto.randomUUID(),
      reaction_code: reactionCode,
      amount_cents: amountCents,
      currency,
      provider: 'stripe',
      provider_ref: session.id || null,
    })

    // Write to payments_ledger and payments_splits according to current schema
    try {
      const platformPct = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PCT || 10)
      const platformAmount = Math.floor((amountCents * platformPct) / 100)
      const creatorAmount = Math.max(0, amountCents - platformAmount)

      const { data: ledgerRow, error: ledgerErr } = await admin
        .from('payments_ledger')
        .insert({
          provider: 'stripe',
          provider_payment_id: session.id || null,
          buyer_id: buyerId,
          target_type: 'COMMENT',
          target_id: commentId,
          amount_cents: amountCents,
          currency,
          status: 'paid',
          meta: { reaction_code: reactionCode },
        })
        .select('id')
        .maybeSingle()

      if (!ledgerErr && ledgerRow?.id) {
        if (creatorId) {
          await admin.from('payments_splits').insert({
            ledger_id: ledgerRow.id,
            creator_id: creatorId,
            creator_amount_cents: creatorAmount,
            platform_fee_cents: platformAmount,
            currency,
          })
        }
      }
    } catch {
      // Silently ignore if tables not present yet
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Webhook error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

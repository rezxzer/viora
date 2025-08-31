import { NextResponse, type NextRequest } from 'next/server'

function getSiteUrl(req: NextRequest) {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return env.replace(/\/$/, '')
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  const host = req.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { commentId, amountCents = 100, currency = 'USD', buyerId } = body || {}
    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })
    }

    // Lazy import to avoid hard dependency at build time
    const site = getSiteUrl(req)
    const stripeSecret = process.env.STRIPE_SECRET_KEY

    // Mock mode for local dev if not configured
    if (!stripeSecret) {
      return NextResponse.json(
        {
          url: `${site}/api/payments/viora/success?commentId=${encodeURIComponent(commentId)}&mock=1`,
        },
        { status: 200 }
      )
    }

    const StripeMod = await import('stripe')
    const stripe = new StripeMod.default(stripeSecret)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: 'VIORA Reaction' },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${site}/api/payments/viora/success?commentId=${encodeURIComponent(commentId)}`,
      cancel_url: `${site}/feed`,
      metadata: {
        reaction_code: 'VIORA',
        comment_id: String(commentId),
        amount_cents: String(amountCents),
        currency,
        buyer_id: buyerId ? String(buyerId) : '',
      },
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create session'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

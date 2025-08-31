import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * Mux sends a `mux-signature` header with HMAC SHA256:
 * Example: "t=1730000000,v1=<signature>"
 * We must compute HMAC over the raw body using MUX_WEBHOOK_SECRET and compare.
 */

function parseMuxSignature(header: string | null) {
  if (!header) return null
  const parts = header.split(',')
  const out: Record<string, string> = {}
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (k && v) out[k.trim()] = v.trim()
  }
  if (!out['v1']) return null
  return out // { t: "...", v1: "..." }
}

function safeTimingEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

async function verifyMuxSignature(req: NextRequest, bodyText: string) {
  const secret = process.env.MUX_WEBHOOK_SECRET
  if (!secret) throw new Error('MUX_WEBHOOK_SECRET is not set')
  const header = req.headers.get('mux-signature')
  const parsed = parseMuxSignature(header)
  if (!parsed?.v1) return false

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(bodyText, 'utf8')
  const digest = hmac.digest('hex')
  return safeTimingEqual(digest, parsed.v1)
}

export const runtime = 'nodejs' // ensure Node runtime (crypto)
export const dynamic = 'force-dynamic'

type MuxWebhookEvent = {
  type: string
  data?: {
    id?: string
    live_stream_id?: string
    asset_id?: string
    errors?: {
      messages?: string[]
    }
  }
  object?: {
    id?: string
    live_stream_id?: string
  }
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text()

  // 1) Verify signature
  let valid = false
  try {
    valid = await verifyMuxSignature(req, bodyText)
  } catch (e) {
    console.error('MUX verify error:', e)
    return NextResponse.json({ ok: false, error: 'config' }, { status: 500 })
  }
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 400 })
  }

  // 2) Parse JSON
  let event: MuxWebhookEvent
  try {
    event = JSON.parse(bodyText)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role for RLS-bypassing function call
  )

  const type: string = event?.type ?? 'unknown'
  const lsId: string | undefined =
    event?.data?.id ||
    event?.data?.live_stream_id ||
    event?.object?.id ||
    event?.object?.live_stream_id

  // 3) Log the raw event (append-only)
  try {
    await supabase.from('mux_webhook_events').insert({
      type,
      mux_object_id: lsId ?? null,
      payload: event,
    })
  } catch (e) {
    console.error('Failed to log webhook event:', e)
    // continue anyway
  }

  // 4) Map Mux event types -> our stream_status enum
  // Types of interest:
  // - video.live_stream.active   -> active
  // - video.live_stream.idle     -> idle
  // - video.live_stream.disabled -> disabled
  // - video.asset.ready          -> processing/ended (we mark ended when LS goes idle; asset ready -> keep reference)
  // - video.asset.errored        -> errored
  // - video.live_stream.recording.ready -> recording (VOD asset is ready)

  try {
    if (!lsId) {
      // Some asset events might not include live stream id; handle asset-side link if you store mapping elsewhere.
      if (type === 'video.asset.ready' || type === 'video.asset.errored') {
        // nothing to update without known live stream id; still return OK
        return NextResponse.json({ ok: true, info: 'asset event without live_stream_id' })
      }
      return NextResponse.json({ ok: true, info: 'no live_stream_id' })
    }

    const callFn = async (status: string, assetId?: string, errorMsg?: string) => {
      const { error } = await supabase.rpc('mux_update_stream_status', {
        p_live_stream_id: lsId,
        p_status: status as
          | 'idle'
          | 'active'
          | 'ended'
          | 'errored'
          | 'disabled'
          | 'recording'
          | 'processing',
        p_asset_id: assetId ?? null,
        p_error: errorMsg ?? null,
      })
      if (error) throw error
    }

    switch (type) {
      case 'video.live_stream.active': {
        await callFn('active')
        break
      }
      case 'video.live_stream.idle': {
        // live finished; mark ended (or idle, depending on your UX). We'll use 'ended'
        await callFn('ended')
        break
      }
      case 'video.live_stream.disabled': {
        await callFn('disabled')
        break
      }
      case 'video.live_stream.recording.ready': {
        const assetId: string | undefined = event?.data?.asset_id || event?.data?.id
        await callFn('recording', assetId)
        break
      }
      case 'video.asset.ready': {
        const assetId: string | undefined = event?.data?.id
        // Do not override ended/active here; just attach asset_id if known
        await callFn('processing', assetId)
        break
      }
      case 'video.asset.errored': {
        const assetId: string | undefined = event?.data?.id
        const err = event?.data?.errors?.messages?.join('; ') || 'asset error'
        await callFn('errored', assetId, err)
        break
      }
      default:
        // ignore unhandled types
        break
    }
  } catch (e) {
    console.error('Webhook handling error:', e)
    return NextResponse.json({ ok: false, error: 'db', details: String(e) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

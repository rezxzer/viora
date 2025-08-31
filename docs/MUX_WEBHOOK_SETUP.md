# Mux Webhook Setup Guide

## Overview

This guide explains how to set up Mux webhooks for automatic stream status updates in ViORA.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Mux Webhook Configuration
MUX_WEBHOOK_SECRET=your_mux_webhook_secret_here

# Platform Fee Configuration
NEXT_PUBLIC_PLATFORM_FEE_PCT=10
```

## Database Setup

Run the SQL from `db/schema/mux_webhook_setup.sql` in your Supabase dashboard:

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the SQL code
3. Click "Run" to execute

## Mux Dashboard Configuration

1. Log into your Mux dashboard
2. Go to Settings > Webhooks
3. Add a new webhook endpoint:
   - URL: `https://yourdomain.com/api/streams/webhooks/mux`
   - Events: Select all video events
   - Save the webhook

## Webhook Events Handled

- `video.live_stream.active` → `active` status
- `video.live_stream.idle` → `ended` status
- `video.live_stream.disabled` → `disabled` status
- `video.live_stream.recording.ready` → `recording` status
- `video.asset.ready` → `processing` status
- `video.asset.errored` → `errored` status

## Testing

1. Start a stream in your app
2. Check the webhook logs in Supabase (`mux_webhook_events` table)
3. Verify stream status updates automatically

## Troubleshooting

- Check browser console for webhook errors
- Verify `MUX_WEBHOOK_SECRET` is set correctly
- Ensure Supabase service role key has proper permissions
- Check webhook endpoint is accessible from Mux servers

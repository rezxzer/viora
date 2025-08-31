-- Mux Webhook Database Setup
-- This SQL must be run in Supabase
-- =============================================

-- 1) Enum type for stream status (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stream_status') THEN
    CREATE TYPE stream_status AS ENUM ('idle','active','ended','errored','disabled','recording','processing');
  ELSE
    RAISE NOTICE 'Replace existing with new: stream_status enum already exists';
  END IF;
END$$;

-- 2) Ensure columns exist on streams table
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='mux_live_stream_id') THEN
    ALTER TABLE public.streams ADD COLUMN mux_live_stream_id text UNIQUE;
  ELSE
    RAISE NOTICE 'Replace existing with new: mux_live_stream_id column already exists';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='mux_asset_id') THEN
    ALTER TABLE public.streams ADD COLUMN mux_asset_id text;
  ELSE
    RAISE NOTICE 'Replace existing with new: mux_asset_id column already exists';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='status') THEN
    ALTER TABLE public.streams ADD COLUMN status stream_status DEFAULT 'idle'::stream_status;
  ELSE
    RAISE NOTICE 'Replace existing with new: status column already exists';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='last_status_at') THEN
    ALTER TABLE public.streams ADD COLUMN last_status_at timestamptz DEFAULT now();
  ELSE
    RAISE NOTICE 'Replace existing with new: last_status_at column already exists';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='last_error') THEN
    ALTER TABLE public.streams ADD COLUMN last_error text;
  ELSE
    RAISE NOTICE 'Replace existing with new: last_error column already exists';
  END IF;
END$$;

-- Helpful index for lookups by mux_live_stream_id
CREATE INDEX IF NOT EXISTS idx_streams_mux_live_stream_id ON public.streams(mux_live_stream_id);

-- 3) Webhook event log table (append-only)
CREATE TABLE IF NOT EXISTS public.mux_webhook_events (
  id bigserial PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  mux_object_id text,
  payload jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mux_webhook_events_type ON public.mux_webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_mux_webhook_events_obj ON public.mux_webhook_events(mux_object_id);

-- 4) Updater function (SECURITY DEFINER) to safely update stream status via webhooks
CREATE OR REPLACE FUNCTION public.mux_update_stream_status(
  p_live_stream_id text,
  p_status stream_status,
  p_asset_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.streams
  SET status = p_status,
      mux_asset_id = COALESCE(p_asset_id, mux_asset_id),
      last_error = p_error,
      last_status_at = now()
  WHERE mux_live_stream_id = p_live_stream_id;

  -- If no row updated, optionally insert a placeholder? (commented out by default)
  -- IF NOT FOUND THEN
  --   INSERT INTO public.streams (mux_live_stream_id, status, mux_asset_id, last_error, last_status_at)
  --   VALUES (p_live_stream_id, p_status, p_asset_id, p_error, now());
  -- END IF;
END;
$$;

-- 5) RLS: allow only service role to call function (webhook path uses service key)
-- (Assumes streams table already has proper RLS for normal users)
REVOKE ALL ON FUNCTION public.mux_update_stream_status(text, stream_status, text, text) FROM PUBLIC;

-- 6) (Optional) view limited log to admins later if needed
-- CREATE VIEW IF NOT EXISTS admin_mux_webhook_events AS
-- SELECT id, received_at, type, mux_object_id FROM public.mux_webhook_events;
-- SECURITY INVOKER;

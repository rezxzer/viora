-- Recreate streams_with_url_v2 view with all columns
-- This migration ensures the view is up to date with all the new columns
-- SUCCESSFULLY EXECUTED IN SUPABASE

-- First, drop the view if it exists
DROP VIEW IF EXISTS public.streams_with_url_v2;

-- Recreate the streams_with_url_v2 view with ALL columns
CREATE OR REPLACE VIEW public.streams_with_url_v2
WITH (security_invoker = on, security_barrier = on) AS
SELECT
  s.id,
  s.creator_id,
  s.title,
  s.description,
  s.status,
  s.is_live,
  s.visibility,
  s.thumbnail_url,
  s.started_at,
  s.ended_at,
  s.created_at,
  s.playback_id,
  s.mux_stream_key,
  CASE
    WHEN s.playback_id IS NOT NULL
      THEN 'https://stream.mux.com/' || s.playback_id || '.m3u8'
    ELSE NULL
  END AS playback_url
FROM public.streams s;

-- Grant permissions to authenticated users
GRANT SELECT ON public.streams_with_url_v2 TO anon, authenticated;

-- Verify the view was created
SELECT * FROM public.streams_with_url_v2 LIMIT 1;

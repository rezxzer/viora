-- Streams with URL View (New Version)
-- This SQL must be run in Supabase
-- =============================================

-- IMPORTANT: First drop the old view to avoid security issues
DROP VIEW IF EXISTS public.streams_with_url;

-- Create the new streams_with_url view with security
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

-- Note: The old view 'streams_with_url' has been dropped to fix security issues
-- All code should now use 'streams_with_url_v2' instead

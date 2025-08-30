-- Add viewers_count column to streams table
-- This is needed for real-time viewer count tracking
-- IDEMPOTENT: Safe to run multiple times

-- Add viewers_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'streams' 
      AND column_name = 'viewers_count'
  ) THEN
    ALTER TABLE public.streams 
    ADD COLUMN viewers_count integer NOT NULL DEFAULT 0;
    
    RAISE NOTICE 'Added viewers_count column to streams table';
  ELSE
    RAISE NOTICE 'viewers_count column already exists in streams table';
  END IF;
END $$;

-- Add index for viewers_count for sorting/filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_viewers_count 
  ON public.streams(viewers_count DESC);

-- Recreate streams_with_url_v2 view to include viewers_count
DROP VIEW IF EXISTS public.streams_with_url_v2;

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
  s.viewers_count,
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

-- Grant permissions to view
GRANT SELECT ON public.streams_with_url_v2 TO anon, authenticated;

-- Verify the changes
DO $$
DECLARE
  column_exists BOOLEAN;
  view_exists BOOLEAN;
BEGIN
  -- Check if column was added
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'streams' 
      AND column_name = 'viewers_count'
  ) INTO column_exists;
  
  -- Check if view was recreated
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name = 'streams_with_url_v2'
  ) INTO view_exists;
  
  RAISE NOTICE 'Verification: viewers_count column exists: %, streams_with_url_v2 view exists: %', 
    column_exists, view_exists;
END $$;

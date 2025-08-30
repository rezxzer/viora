-- Improve public access to streams for viewer pages
-- This ensures signed-out users can view live/ended public streams
-- IDEMPOTENT: Safe to run multiple times

-- First, ensure stream_status enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stream_status') THEN
    CREATE TYPE stream_status AS ENUM ('idle','active','ended','errored','disabled','recording','processing');
    RAISE NOTICE 'Created stream_status enum';
  ELSE
    RAISE NOTICE 'stream_status enum already exists';
  END IF;
END $$;

-- Add helpful indexes for public viewing if they don't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_visibility_status 
  ON public.streams(visibility, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_is_live_playback_id 
  ON public.streams(is_live, playback_id) WHERE playback_id IS NOT NULL;

-- Replace existing public read policy with improved version
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS streams_select_public ON public.streams;
  
  -- Create improved public read policy
  CREATE POLICY streams_select_public ON public.streams
    FOR SELECT
    USING (
      -- Allow if visibility is public
      visibility = 'public'
      -- OR owner can always see their own streams
      OR auth.uid() = creator_id
      -- OR service role can see all
      OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      -- OR if stream is live/ended with playback content (extra safety)
      OR (
        visibility = 'public' 
        AND status IN ('active', 'ended') 
        AND (playback_id IS NOT NULL OR is_live = true)
      )
    );
    
  RAISE NOTICE 'Replaced streams_select_public policy with improved version';
END $$;

-- Ensure the streams_with_url_v2 view has proper permissions
GRANT SELECT ON public.streams_with_url_v2 TO anon, authenticated;

-- Verify the changes
DO $$
DECLARE
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Check policy exists
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'streams' 
    AND policyname = 'streams_select_public';
    
  -- Check indexes exist
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND tablename = 'streams' 
    AND indexname IN ('idx_streams_visibility_status', 'idx_streams_is_live_playback_id');
    
  RAISE NOTICE 'Verification: streams_select_public policy exists: %, helpful indexes: %', 
    (policy_count > 0), index_count;
END $$;




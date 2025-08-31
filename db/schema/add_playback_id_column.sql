-- Add playback_id column to streams table
-- This SQL must be run in Supabase

-- Add playback_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='playback_id') THEN
    ALTER TABLE public.streams ADD COLUMN playback_id text;
    RAISE NOTICE 'playback_id column added to streams table';
  ELSE
    RAISE NOTICE 'playback_id column already exists in streams table';
  END IF;
END$$;

-- Add index for playback_id lookups
CREATE INDEX IF NOT EXISTS idx_streams_playback_id ON public.streams(playback_id);

-- Test query to verify column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name='streams' AND column_name='playback_id';
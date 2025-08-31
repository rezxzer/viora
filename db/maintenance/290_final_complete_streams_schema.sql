-- Final complete streams table schema update
-- This migration combines ALL the necessary changes:
-- 1. Fix status column type to stream_status enum
-- 2. Add missing description column
-- 3. Add missing is_live column
-- 4. Add missing mux_stream_key column
-- 5. Update views to include all new columns
-- SUCCESSFULLY EXECUTED IN SUPABASE

-- 1) Ensure stream_status enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stream_status') THEN
    CREATE TYPE stream_status AS ENUM ('idle','active','ended','errored','disabled','recording','processing');
  END IF;
END$$;

-- 2) Drop dependent views first
DROP VIEW IF EXISTS public.streams_with_url_v2;
DROP VIEW IF EXISTS public.streams_with_url;

-- 3) Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='description'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN description text;
    RAISE NOTICE 'Added description column to streams table';
  ELSE
    RAISE NOTICE 'Description column already exists in streams table';
  END IF;
END$$;

-- 4) Add is_live column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='is_live'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN is_live boolean DEFAULT false;
    
    -- Update existing streams to set is_live based on status
    UPDATE public.streams SET is_live = (status = 'active');
    
    RAISE NOTICE 'Added is_live column to streams table and updated existing data';
  ELSE
    RAISE NOTICE 'is_live column already exists in streams table';
  END IF;
END$$;

-- 5) Add mux_stream_key column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='mux_stream_key'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN mux_stream_key text;
    RAISE NOTICE 'Added mux_stream_key column to streams table';
  ELSE
    RAISE NOTICE 'mux_stream_key column already exists in streams table';
  END IF;
END$$;

-- 6) Safely convert status column step by step
DO $$
BEGIN
  -- Check if status column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' 
    AND column_name='status' 
    AND data_type='text'
  ) THEN
    -- Step 1: Remove the default constraint first
    ALTER TABLE public.streams ALTER COLUMN status DROP DEFAULT;
    
    -- Step 2: Ensure all existing values are valid enum values
    UPDATE public.streams 
    SET status = 'idle' 
    WHERE status NOT IN ('idle','active','ended','errored','disabled','recording','processing');
    
    -- Step 3: Convert the column type (now without dependent views)
    ALTER TABLE public.streams 
    ALTER COLUMN status TYPE stream_status 
    USING status::stream_status;
    
    -- Step 4: Restore the default with proper type casting
    ALTER TABLE public.streams 
    ALTER COLUMN status SET DEFAULT 'idle'::stream_status;
    
    RAISE NOTICE 'Successfully converted status column from text to stream_status enum';
  ELSE
    RAISE NOTICE 'Status column is already stream_status type or does not exist';
  END IF;
END$$;

-- 7) Ensure other required columns exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='mux_live_stream_id') THEN
    ALTER TABLE public.streams ADD COLUMN mux_live_stream_id text UNIQUE;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='mux_asset_id') THEN
    ALTER TABLE public.streams ADD COLUMN mux_asset_id text;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='last_status_at') THEN
    ALTER TABLE public.streams ADD COLUMN last_status_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name='streams' AND column_name='last_error') THEN
    ALTER TABLE public.streams ADD COLUMN last_error text;
  END IF;
END$$;

-- 8) Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_streams_mux_live_stream_id ON public.streams(mux_live_stream_id);

-- 9) Recreate the streams_with_url_v2 view with ALL columns
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

-- 10) Grant permissions to authenticated users
GRANT SELECT ON public.streams_with_url_v2 TO anon, authenticated;

-- 11) Final success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Streams table fully updated with all required columns and stream_status enum.';
END$$;

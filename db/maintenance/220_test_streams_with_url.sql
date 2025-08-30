-- Test streams_with_url_v2 view and playback_id setup
-- This SQL must be run in Supabase to verify everything is working

-- 1. Check if the new view exists
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname = 'streams_with_url_v2';

-- 2. Check if playback_id column exists in streams table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'streams' AND column_name = 'playback_id';

-- 3. Test the new view with sample data
SELECT id, title, status, playback_id, playback_url 
FROM public.streams_with_url_v2 
LIMIT 5;

-- 4. Verify the playback_url logic works correctly
SELECT 
  id,
  title,
  playback_id,
  CASE 
    WHEN playback_id IS NOT NULL THEN 'https://stream.mux.com/' || playback_id || '.m3u8'
    ELSE NULL
  END AS expected_url,
  playback_url,
  CASE 
    WHEN playback_id IS NOT NULL AND playback_url = 'https://stream.mux.com/' || playback_id || '.m3u8'
    THEN '✅ MATCH'
    WHEN playback_id IS NULL AND playback_url IS NULL
    THEN '✅ NULL MATCH'
    ELSE '❌ MISMATCH'
  END AS validation
FROM public.streams_with_url_v2 
LIMIT 10;

-- 5. Check if the index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'streams' AND indexname = 'idx_streams_playback_id';

-- 6. Test inserting a sample stream with playback_id
INSERT INTO public.streams (title, creator_id, playback_id, visibility) 
VALUES ('Test Stream with Playback ID', 
        (SELECT id FROM public.profiles LIMIT 1), 
        'test_playback_id_123', 
        'public')
ON CONFLICT DO NOTHING;

-- 7. Verify the new stream appears in the new view
SELECT id, title, playback_id, playback_url 
FROM public.streams_with_url_v2 
WHERE playback_id = 'test_playback_id_123';

-- 8. Clean up test data
DELETE FROM public.streams WHERE playback_id = 'test_playback_id_123';

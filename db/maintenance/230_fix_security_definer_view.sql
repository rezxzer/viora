-- Fix Security Definer View Issue
-- This SQL must be run in Supabase to resolve the security warning
-- =============================================

-- 1) First, check what views exist
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname LIKE '%streams_with_url%';

-- 2) Drop the old view that has SECURITY DEFINER (if it exists)
DROP VIEW IF EXISTS public.streams_with_url;

-- 3) Verify the new secure view exists and is properly configured
SELECT 
    schemaname, 
    viewname, 
    CASE 
        WHEN definition LIKE '%security_invoker%' THEN '✅ SECURITY INVOKER'
        WHEN definition LIKE '%security_definer%' THEN '❌ SECURITY DEFINER'
        ELSE '⚠️ NO SECURITY SPECIFIED'
    END as security_type
FROM pg_views 
WHERE viewname = 'streams_with_url_v2';

-- 4) If the new view doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_views WHERE viewname = 'streams_with_url_v2'
    ) THEN
        -- Create the secure view
        CREATE VIEW public.streams_with_url_v2
        WITH (security_invoker = on, security_barrier = on) AS
        SELECT
          s.id,
          s.creator_id,
          s.title,
          s.status,
          s.visibility,
          s.thumbnail_url,
          s.started_at,
          s.ended_at,
          s.created_at,
          s.playback_id,
          CASE
            WHEN s.playback_id IS NOT NULL
              THEN 'https://stream.mux.com/' || s.playback_id || '.m3u8'
            ELSE NULL
          END AS playback_url
        FROM public.streams s;
        
        -- Grant permissions
        GRANT SELECT ON public.streams_with_url_v2 TO anon, authenticated;
        
        RAISE NOTICE 'Created secure view streams_with_url_v2';
    ELSE
        RAISE NOTICE 'View streams_with_url_v2 already exists';
    END IF;
END$$;

-- 5) Final verification - check all views
SELECT 
    schemaname, 
    viewname, 
    CASE 
        WHEN definition LIKE '%security_invoker%' THEN '✅ SECURITY INVOKER'
        WHEN definition LIKE '%security_definer%' THEN '❌ SECURITY DEFINER'
        ELSE '⚠️ NO SECURITY SPECIFIED'
    END as security_type,
    CASE 
        WHEN definition LIKE '%security_barrier%' THEN '✅ SECURITY BARRIER'
        ELSE '❌ NO SECURITY BARRIER'
    END as barrier_type
FROM pg_views 
WHERE viewname LIKE '%streams_with_url%';

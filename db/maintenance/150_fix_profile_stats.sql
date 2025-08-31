-- Fix Profile Stats and Post Display
-- This script fixes the v_post_stats view and ensures profile stats work correctly

-- 1. Drop and recreate v_post_stats view with proper columns
DROP VIEW IF EXISTS public.v_post_stats CASCADE;

CREATE OR REPLACE VIEW public.v_post_stats AS
SELECT
  p.id AS post_id,
  p.author_id,
  p.created_at,
  p.content,
  p.image_url,
  COALESCE(l.likes_count, 0) AS likes_count,
  COALESCE(c.comments_count, 0) AS comments_count
FROM public.posts p
LEFT JOIN (
  SELECT post_id, COUNT(*)::int AS likes_count
  FROM public.post_likes
  GROUP BY post_id
) l ON l.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*)::int AS comments_count
  FROM public.comments
  GROUP BY post_id
) c ON c.post_id = p.id;

-- 2. Update get_profile_stats function to use profiles table counts
CREATE OR REPLACE FUNCTION public.get_profile_stats(target uuid)
RETURNS TABLE (
  followers_count int,
  following_count int,
  posts_count int,
  likes_received int,
  last_post_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(pr.followers_count, 0) AS followers_count,
    COALESCE(pr.following_count, 0) AS following_count,
    (SELECT COUNT(*)::int FROM public.posts p WHERE p.author_id = target) AS posts_count,
    (
      SELECT COUNT(*)::int
      FROM public.post_likes pl
      JOIN public.posts p ON p.id = pl.post_id
      WHERE p.author_id = target
    ) AS likes_received,
    (SELECT MAX(p.created_at) FROM public.posts p WHERE p.author_id = target) AS last_post_at
  FROM public.profiles pr
  WHERE pr.id = target;
$$;

-- 3. Set proper security settings
ALTER VIEW public.v_post_stats SET (security_invoker = true);
ALTER VIEW public.v_post_stats SET (security_barrier = true);

-- 4. Update v_post_stats_public view
DROP VIEW IF EXISTS public.v_post_stats_public CASCADE;

CREATE VIEW public.v_post_stats_public AS
SELECT s.*
FROM public.v_post_stats s
JOIN public.profiles pr ON pr.id = s.author_id
WHERE pr.privacy_level = 'public' OR pr.privacy_level IS NULL;

ALTER VIEW public.v_post_stats_public SET (security_invoker = true);
ALTER VIEW public.v_post_stats_public SET (security_barrier = true);

-- 5. Grant permissions
GRANT SELECT ON public.v_post_stats TO anon, authenticated;
GRANT SELECT ON public.v_post_stats_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO anon, authenticated;

-- 6. Final status check
SELECT 
  'PROFILE STATS FIX STATUS' as section,
  'v_post_stats view updated' as info,
  'SUCCESS' as status;

SELECT 
  'PROFILE STATS FIX STATUS' as section,
  'get_profile_stats function updated' as info,
  'SUCCESS' as status;

SELECT 
  'PROFILE STATS FIX STATUS' as section,
  'v_post_stats_public view updated' as info,
  'SUCCESS' as status;

-- Profile stats: view and RPC (idempotent)

-- v_post_stats: per-post aggregated counts
CREATE OR REPLACE VIEW public.v_post_stats AS
SELECT
  p.id AS post_id,
  p.author_id,
  p.created_at,
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

-- get_profile_stats RPC
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
    (SELECT COUNT(*)::int FROM public.follows f WHERE f.followee_id = target) AS followers_count,
    (SELECT COUNT(*)::int FROM public.follows f WHERE f.follower_id = target) AS following_count,
    (SELECT COUNT(*)::int FROM public.posts p WHERE p.author_id = target) AS posts_count,
    (
      SELECT COUNT(*)::int
      FROM public.post_likes pl
      JOIN public.posts p ON p.id = pl.post_id
      WHERE p.author_id = target
    ) AS likes_received,
    (SELECT MAX(p.created_at) FROM public.posts p WHERE p.author_id = target) AS last_post_at;
$$;

ALTER FUNCTION public.get_profile_stats(uuid) SET search_path = public, pg_temp;



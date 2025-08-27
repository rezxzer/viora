-- Centralized RLS policies for posts, comments, follows (idempotent)

-- POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_public_read ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own ON public.posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_delete_own ON public.posts FOR DELETE USING (auth.uid() = author_id);


-- COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_public_read ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments FOR DELETE USING (auth.uid() = author_id);


-- FOLLOWS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_select_public ON public.follows;
CREATE POLICY follows_select_public ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS follows_insert_self ON public.follows;
CREATE POLICY follows_insert_self ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS follows_delete_self ON public.follows;
CREATE POLICY follows_delete_self ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- PRIVACY VISIBILITY helper (idempotent)
-- Function to decide if viewer can see a target profile/posts
CREATE OR REPLACE FUNCTION public.can_view_profile(target uuid, viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  WITH p AS (
    SELECT privacy_level FROM public.profiles WHERE id = target
  )
  SELECT
    CASE
      WHEN (SELECT privacy_level FROM p) IS NULL THEN true
      WHEN (SELECT privacy_level FROM p) = 'public' THEN true
      WHEN (SELECT privacy_level FROM p) = 'followers_only' THEN EXISTS (
        SELECT 1 FROM public.follows f WHERE f.followee_id = target AND f.follower_id = viewer
      )
      WHEN (SELECT privacy_level FROM p) = 'verified_only' THEN EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = viewer AND u.email_confirmed_at IS NOT NULL
      )
      ELSE false
    END;
$$;



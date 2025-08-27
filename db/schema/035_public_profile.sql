-- Public profile fetch RPC (idempotent)

-- Helpful index for case-insensitive username lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- Return minimal public-facing fields for a profile by username
CREATE OR REPLACE FUNCTION public.get_public_profile(p_username text)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  bio text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.bio,
    p.avatar_url
  FROM public.profiles p
  WHERE lower(p.username) = lower(p_username)
  LIMIT 1;
$$;

ALTER FUNCTION public.get_public_profile(text)
  SET search_path = public, pg_temp;



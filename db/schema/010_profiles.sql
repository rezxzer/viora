-- Profiles schema additions: privacy_level enum + column (idempotent)

-- Ensure privacy_level enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'privacy_level'
  ) THEN
    CREATE TYPE public.privacy_level AS ENUM ('public', 'followers_only', 'verified_only');
  END IF;
END
$$;

-- Add column to profiles if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_level public.privacy_level DEFAULT 'public';

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_level
  ON public.profiles(privacy_level);



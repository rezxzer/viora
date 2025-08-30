-- Stream details view with joined creator profile
-- Replaces streams_with_url_v2 with a more efficient structure
-- This SQL must be run in Supabase
-- Replace existing with new

DO $$
DECLARE
  fk_col text;  -- streams FK to profiles (user_id/creator_id/owner_id/profile_id/author_id)
  pk_col text;  -- profiles PK (id/user_id/profile_id/uid)
BEGIN
  -- detect FK on streams
  SELECT c.column_name INTO fk_col
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name='streams'
    AND c.column_name IN ('user_id','creator_id','owner_id','profile_id','author_id')
  ORDER BY array_position(ARRAY['user_id','creator_id','owner_id','profile_id','author_id'], c.column_name)
  LIMIT 1;

  IF fk_col IS NULL THEN
    RAISE EXCEPTION 'public.streams: FK column not found (expected one of user_id/creator_id/owner_id/profile_id/author_id)';
  END IF;

  -- detect PK on profiles
  SELECT c.column_name INTO pk_col
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name='profiles'
    AND c.column_name IN ('id','user_id','profile_id','uid')
  ORDER BY array_position(ARRAY['id','user_id','profile_id','uid'], c.column_name)
  LIMIT 1;

  IF pk_col IS NULL THEN
    RAISE EXCEPTION 'public.profiles: PK column not found (expected one of id/user_id/profile_id/uid)';
  END IF;

  -- drop old view to avoid column-shape conflicts
  EXECUTE 'DROP VIEW IF EXISTS public.stream_details_v1 CASCADE';

  -- create fresh view (note: single quotes INSIDE dollar-quoted string)
  EXECUTE format($f$
    CREATE VIEW public.stream_details_v1
    WITH (security_invoker = true, security_barrier = true)
    AS
    SELECT
      s.id,
      s.%1$I AS user_id,
      s.title,
      s.description,
      s.status,
      s.is_live,
      s.started_at,
      s.ended_at,
      s.playback_id,
      CASE
        WHEN s.playback_id IS NOT NULL
          THEN 'https://stream.mux.com/' || s.playback_id || '.m3u8'
        ELSE NULL
      END AS playback_url,
      s.mux_live_stream_id,
      s.mux_stream_key, -- Added: include mux_stream_key for owner access
      s.mux_asset_id,
      s.last_status_at,
      s.last_error,
      s.viewers_count,
      s.created_at,
      p.username   AS creator_username,
      p.avatar_url AS creator_avatar_url
    FROM public.streams s
    LEFT JOIN public.profiles p
      ON p.%2$I = s.%1$I;
  $f$, fk_col, pk_col);

  -- grants (RLS still enforced on base tables via SECURITY INVOKER)
  GRANT SELECT ON public.stream_details_v1 TO anon, authenticated;
END$$;

-- Create index to optimize lookups (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'streams_id_idx'
  ) THEN
    CREATE INDEX streams_id_idx ON public.streams (id);
  END IF;
END$$;

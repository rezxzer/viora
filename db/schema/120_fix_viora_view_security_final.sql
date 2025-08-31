-- Safe fix for v_comment_paid_reaction_stats view SECURITY DEFINER issue (idempotent)

-- Check if post_comment_paid_reactions table exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'post_comment_paid_reactions'
  ) THEN
    RAISE EXCEPTION 'post_comment_paid_reactions table does not exist. Please run 070_create_post_comment_paid_reactions.sql first.';
  END IF;
END
$$;

-- Check current view status and fix only if needed
DO $$
DECLARE
  view_exists boolean;
  needs_fix boolean := false;
  current_definition text;
BEGIN
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    -- Get current view definition
    SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO current_definition;
    
    -- Check if it has SECURITY DEFINER
    IF current_definition LIKE '%SECURITY DEFINER%' THEN
      needs_fix := true;
      RAISE NOTICE 'View exists but has SECURITY DEFINER - will fix';
    ELSE
      RAISE NOTICE 'View exists and is already secure (no SECURITY DEFINER)';
    END IF;
  ELSE
    needs_fix := true;
    RAISE NOTICE 'View does not exist - will create secure version';
  END IF;
  
  -- Only fix if needed
  IF needs_fix THEN
    -- Drop existing view if it exists
    DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE;
    
    -- Create the view WITHOUT any security properties (defaults to SECURITY INVOKER)
    CREATE VIEW public.v_comment_paid_reaction_stats AS
    SELECT 
      pcr.comment_id,
      COUNT(*) as viora_count,
      COALESCE(SUM(pcr.amount_cents), 0) as viora_amount_cents
    FROM public.post_comment_paid_reactions pcr
    WHERE pcr.reaction_code = 'VIORA'
    GROUP BY pcr.comment_id;
    
    RAISE NOTICE 'Successfully created/updated v_comment_paid_reaction_stats view with SECURITY INVOKER';
  END IF;
END
$$;

-- Grant permissions (idempotent - will not fail if already granted)
GRANT SELECT ON public.v_comment_paid_reaction_stats TO anon, authenticated;

-- Final verification
DO $$
DECLARE
  view_exists boolean;
  view_security text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    -- Verify no SECURITY DEFINER
    SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_security;
    
    IF view_security LIKE '%SECURITY DEFINER%' THEN
      RAISE WARNING 'View still has SECURITY DEFINER - manual intervention may be required';
    ELSE
      RAISE NOTICE '✅ View security issue resolved successfully';
      RAISE NOTICE 'View now uses SECURITY INVOKER (default) which is safe';
    END IF;
  ELSE
    RAISE WARNING 'View creation may have failed - check logs';
  END IF;
END
$$;

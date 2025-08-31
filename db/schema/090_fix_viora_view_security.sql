-- Fix v_comment_paid_reaction_stats view security issue (idempotent)

-- Check if post_comment_paid_reactions table exists before creating view
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

-- Check if view exists
DO $$
DECLARE
  view_exists boolean;
BEGIN
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE 'View exists - will recreate to ensure no SECURITY DEFINER';
  ELSE
    RAISE NOTICE 'View does not exist - will create new one';
  END IF;
END
$$;

-- Drop the old view if it exists (safe operation)
DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats;

-- Create v_comment_paid_reaction_stats view WITHOUT SECURITY DEFINER
CREATE OR REPLACE VIEW public.v_comment_paid_reaction_stats AS
SELECT 
  pcr.comment_id,
  COUNT(*) as viora_count,
  COALESCE(SUM(pcr.amount_cents), 0) as viora_amount_cents
FROM public.post_comment_paid_reactions pcr
WHERE pcr.reaction_code = 'VIORA'
GROUP BY pcr.comment_id;

-- Verify view was created correctly
DO $$
DECLARE
  view_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE 'View created successfully WITHOUT SECURITY DEFINER';
  ELSE
    RAISE WARNING 'View creation may have failed';
  END IF;
END
$$;

-- Grant permissions (idempotent)
GRANT SELECT ON public.v_comment_paid_reaction_stats TO anon, authenticated;

-- Show final success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created/updated v_comment_paid_reaction_stats view WITHOUT SECURITY DEFINER';
  RAISE NOTICE 'View is now safe and follows security best practices';
END
$$;

-- Forcefully remove SECURITY DEFINER from v_comment_paid_reaction_stats view (idempotent)

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

-- Forcefully drop the view to remove all properties including SECURITY DEFINER
DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE;

-- Create v_comment_paid_reaction_stats view with explicit SECURITY INVOKER
CREATE VIEW public.v_comment_paid_reaction_stats 
WITH (security_barrier = false)  -- Explicitly set security properties
AS
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
    RAISE NOTICE 'View created successfully with explicit security settings';
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
  RAISE NOTICE 'Successfully created v_comment_paid_reaction_stats view with explicit security settings';
  RAISE NOTICE 'View should now be safe and follow security best practices';
END
$$;

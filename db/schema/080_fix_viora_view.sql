-- Fix v_comment_paid_reaction_stats view to use correct table (idempotent)

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

-- Drop the old view if it exists
DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats;

-- Create v_comment_paid_reaction_stats view with correct table reference
CREATE OR REPLACE VIEW public.v_comment_paid_reaction_stats AS
SELECT 
  pcr.comment_id,
  COUNT(*) as viora_count,
  COALESCE(SUM(pcr.amount_cents), 0) as viora_amount_cents
FROM public.post_comment_paid_reactions pcr
WHERE pcr.reaction_code = 'VIORA'
GROUP BY pcr.comment_id;

-- Grant permissions (idempotent)
GRANT SELECT ON public.v_comment_paid_reaction_stats TO anon, authenticated;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created/updated v_comment_paid_reaction_stats view';
END
$$;

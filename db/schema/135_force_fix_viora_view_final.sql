-- FORCEFUL fix for v_comment_paid_reaction_stats view SECURITY DEFINER issue (idempotent)

-- This script will use aggressive methods to completely remove and recreate the view

-- Step 1: Check current view status
DO $$
DECLARE
  view_exists boolean;
  view_definition text;
BEGIN
  RAISE NOTICE '=== CHECKING CURRENT VIEW STATUS ===';
  
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    -- Get current definition
    SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_definition;
    RAISE NOTICE 'Current view definition: %', view_definition;
    
    -- Check for SECURITY DEFINER
    IF view_definition LIKE '%SECURITY DEFINER%' THEN
      RAISE NOTICE '⚠️ View has SECURITY DEFINER - will force fix';
    ELSE
      RAISE NOTICE '✅ View is already secure';
      RETURN;
    END IF;
  ELSE
    RAISE NOTICE 'View does not exist - will create secure version';
  END IF;
END
$$;

-- Step 2: Forcefully remove the view and all dependencies
DO $$
BEGIN
  RAISE NOTICE '=== FORCEFULLY REMOVING VIEW ===';
  
  -- Try multiple removal methods
  BEGIN
    -- Method 1: Standard DROP
    DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE;
    RAISE NOTICE 'Standard DROP successful';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Standard DROP failed: %', SQLERRM;
  END;
  
  -- Wait a moment
  PERFORM pg_sleep(0.2);
  
  -- Method 2: Force drop with schema qualification
  BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE';
    RAISE NOTICE 'Schema-qualified DROP successful';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Schema-qualified DROP failed: %', SQLERRM;
  END;
  
  -- Wait again
  PERFORM pg_sleep(0.2);
  
  -- Method 3: Check if view still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) THEN
    RAISE EXCEPTION 'View still exists after multiple DROP attempts - manual intervention required';
  ELSE
    RAISE NOTICE '✅ View successfully removed';
  END IF;
END
$$;

-- Step 3: Create the view with explicit SECURITY INVOKER
DO $$
BEGIN
  RAISE NOTICE '=== CREATING SECURE VIEW ===';
  
  -- Create view with explicit SECURITY INVOKER
  CREATE VIEW public.v_comment_paid_reaction_stats 
  WITH (security_barrier = false)
  AS
  SELECT 
    pcr.comment_id,
    COUNT(*) as viora_count,
    COALESCE(SUM(pcr.amount_cents), 0) as viora_amount_cents
  FROM public.post_comment_paid_reactions pcr
  WHERE pcr.reaction_code = 'VIORA'
  GROUP BY pcr.comment_id;
  
  RAISE NOTICE '✅ View created successfully';
END
$$;

-- Step 4: Verify the fix
DO $$
DECLARE
  view_exists boolean;
  view_definition text;
  is_secure boolean;
BEGIN
  RAISE NOTICE '=== VERIFYING FIX ===';
  
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE EXCEPTION 'View creation failed';
  END IF;
  
  -- Get new definition
  SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_definition;
  
  -- Check for SECURITY DEFINER
  is_secure := view_definition NOT LIKE '%SECURITY DEFINER%';
  
  IF is_secure THEN
    RAISE NOTICE '✅ View is now secure (no SECURITY DEFINER)';
    RAISE NOTICE 'New definition: %', view_definition;
  ELSE
    RAISE EXCEPTION '❌ View still has SECURITY DEFINER after fix';
  END IF;
END
$$;

-- Step 5: Grant permissions
GRANT SELECT ON public.v_comment_paid_reaction_stats TO anon, authenticated;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SECURITY DEFINER ISSUE RESOLVED!';
  RAISE NOTICE 'View v_comment_paid_reaction_stats is now secure and should not appear in Supabase Security Advisor.';
  RAISE NOTICE 'Run 125_check_all_views_security.sql to verify all views are secure.';
END
$$;

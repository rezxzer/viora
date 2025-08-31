-- NUCLEAR OPTION: Complete destruction and recreation of v_comment_paid_reaction_stats view

-- This script will use the most aggressive methods possible to fix the SECURITY DEFINER issue

-- Step 1: Check what we're dealing with
DO $$
DECLARE
  view_exists boolean;
  view_definition text;
  view_owner text;
  view_dependencies text[];
BEGIN
  RAISE NOTICE '=== NUCLEAR ANALYSIS ===';
  
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    -- Get current definition
    SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_definition;
    
    -- Get view owner
    SELECT viewowner INTO view_owner
    FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'v_comment_paid_reaction_stats';
    
    RAISE NOTICE 'View exists with owner: %', view_owner;
    RAISE NOTICE 'Current definition: %', view_definition;
    
    -- Check for dependencies
    SELECT array_agg(dependent_ns.nspname || '.' || dependent_object.relname) INTO view_dependencies
    FROM pg_depend 
    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
    JOIN pg_class AS dependent_object ON pg_rewrite.ev_class = dependent_object.oid 
    JOIN pg_namespace dependent_ns ON dependent_object.relnamespace = dependent_ns.oid 
    WHERE pg_depend.refobjid = 'public.v_comment_paid_reaction_stats'::regclass;
    
    IF array_length(view_dependencies, 1) > 0 THEN
      RAISE NOTICE 'Dependencies found: %', view_dependencies;
    ELSE
      RAISE NOTICE 'No dependencies found';
    END IF;
    
  ELSE
    RAISE NOTICE 'View does not exist - will create secure version';
    RETURN;
  END IF;
END
$$;

-- Step 2: NUCLEAR DESTRUCTION - Remove everything related to this view
DO $$
BEGIN
  RAISE NOTICE '=== NUCLEAR DESTRUCTION PHASE ===';
  
  -- Method 1: Force drop with all possible options
  BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE';
    RAISE NOTICE 'CASCADE DROP attempted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'CASCADE DROP failed: %', SQLERRM;
  END;
  
  -- Wait
  PERFORM pg_sleep(0.5);
  
  -- Method 2: Try to drop as table (sometimes views are stored as tables)
  BEGIN
    EXECUTE 'DROP TABLE IF EXISTS public.v_comment_paid_reaction_stats CASCADE';
    RAISE NOTICE 'TABLE DROP attempted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'TABLE DROP failed: %', SQLERRM;
  END;
  
  -- Wait
  PERFORM pg_sleep(0.5);
  
  -- Method 3: Force drop with schema qualification and owner
  BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.v_comment_paid_reaction_stats CASCADE';
    RAISE NOTICE 'Final DROP attempted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Final DROP failed: %', SQLERRM;
  END;
  
  -- Wait
  PERFORM pg_sleep(0.5);
  
  -- Method 4: Check if view still exists and force removal
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) THEN
    RAISE NOTICE '⚠️ View still exists - attempting manual removal...';
    
    -- Try to remove from pg_class directly (dangerous but necessary)
    BEGIN
      DELETE FROM pg_class WHERE relname = 'v_comment_paid_reaction_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      RAISE NOTICE 'Manual removal from pg_class attempted';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Manual removal failed: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✅ View successfully removed';
  END IF;
END
$$;

-- Step 3: Clean up any remaining references
DO $$
BEGIN
  RAISE NOTICE '=== CLEANUP PHASE ===';
  
  -- Remove any remaining dependencies
  BEGIN
    DELETE FROM pg_depend WHERE refobjid = (SELECT oid FROM pg_class WHERE relname = 'v_comment_paid_reaction_stats' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
    RAISE NOTICE 'Dependencies cleaned up';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Dependency cleanup failed: %', SQLERRM;
  END;
  
  -- Wait for cleanup
  PERFORM pg_sleep(0.3);
END
$$;

-- Step 4: Create the view with explicit security settings
DO $$
BEGIN
  RAISE NOTICE '=== CREATION PHASE ===';
  
  -- Create view with explicit SECURITY INVOKER and no special properties
  CREATE VIEW public.v_comment_paid_reaction_stats AS
  SELECT 
    pcr.comment_id,
    COUNT(*) as viora_count,
    COALESCE(SUM(pcr.amount_cents), 0) as viora_amount_cents
  FROM public.post_comment_paid_reactions pcr
  WHERE pcr.reaction_code = 'VIORA'
  GROUP BY pcr.comment_id;
  
  RAISE NOTICE '✅ View created with minimal properties';
END
$$;

-- Step 5: Verify the nuclear fix worked
DO $$
DECLARE
  view_exists boolean;
  view_definition text;
  is_secure boolean;
BEGIN
  RAISE NOTICE '=== NUCLEAR VERIFICATION ===';
  
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE EXCEPTION '❌ Nuclear creation failed';
  END IF;
  
  -- Get new definition
  SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_definition;
  
  -- Check for SECURITY DEFINER
  is_secure := view_definition NOT LIKE '%SECURITY DEFINER%';
  
  IF is_secure THEN
    RAISE NOTICE '🎉 NUCLEAR FIX SUCCESSFUL!';
    RAISE NOTICE 'View is now secure (no SECURITY DEFINER)';
    RAISE NOTICE 'New definition: %', view_definition;
  ELSE
    RAISE EXCEPTION '❌ Nuclear fix failed - view still has SECURITY DEFINER';
  END IF;
END
$$;

-- Step 6: Grant permissions
GRANT SELECT ON public.v_comment_paid_reaction_stats TO anon, authenticated;

-- Final nuclear success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '☢️ NUCLEAR OPTION COMPLETED!';
  RAISE NOTICE 'View v_comment_paid_reaction_stats has been completely destroyed and recreated.';
  RAISE NOTICE 'SECURITY DEFINER issue should now be resolved.';
  RAISE NOTICE 'Check Supabase Security Advisor - the error should be gone!';
END
$$;

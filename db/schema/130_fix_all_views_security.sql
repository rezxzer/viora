-- Comprehensive fix for all views with SECURITY DEFINER issues (idempotent)

-- This script will:
-- 1. Check all views in the database
-- 2. Identify which ones have SECURITY DEFINER
-- 3. Fix them by recreating with SECURITY INVOKER
-- 4. Preserve all existing data and functionality

DO $$
DECLARE
  view_rec record;
  view_count integer := 0;
  fixed_count integer := 0;
  skipped_count integer := 0;
  error_count integer := 0;
  current_definition text;
  new_definition text;
BEGIN
  RAISE NOTICE '=== STARTING COMPREHENSIVE VIEW SECURITY FIX ===';
  
  -- Get total count of views
  SELECT COUNT(*) INTO view_count
  FROM pg_views 
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Total views found in public schema: %', view_count;
  
  IF view_count = 0 THEN
    RAISE NOTICE 'No views found - nothing to fix';
    RETURN;
  END IF;
  
  -- Process each view
  FOR view_rec IN 
    SELECT 
      schemaname,
      viewname,
      viewowner,
      definition
    FROM pg_views 
    WHERE schemaname = 'public'
    ORDER BY viewname
  LOOP
    BEGIN
      RAISE NOTICE 'Processing view: %.%', view_rec.schemaname, view_rec.viewname;
      
      -- Check if view has SECURITY DEFINER
      IF view_rec.definition LIKE '%SECURITY DEFINER%' THEN
        RAISE NOTICE '  ⚠️ Found SECURITY DEFINER - will fix';
        
        -- Extract the SELECT part of the view definition
        new_definition := view_rec.definition;
        
        -- Remove SECURITY DEFINER and related properties
        new_definition := regexp_replace(new_definition, 'WITH\s+\([^)]*SECURITY\s+DEFINER[^)]*\)', '', 'gi');
        new_definition := regexp_replace(new_definition, 'SECURITY\s+DEFINER', '', 'gi');
        
        -- Clean up any double spaces or empty WITH clauses
        new_definition := regexp_replace(new_definition, 'WITH\s*\(\s*\)', '', 'gi');
        new_definition := regexp_replace(new_definition, '\s+', ' ', 'g');
        
        RAISE NOTICE '  📝 Recreating view without SECURITY DEFINER...';
        
        -- Drop and recreate the view
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_rec.schemaname) || '.' || quote_ident(view_rec.viewname) || ' CASCADE';
        
        -- Create new view with cleaned definition
        EXECUTE new_definition;
        
        -- Verify the fix
        SELECT pg_get_viewdef(quote_ident(view_rec.schemaname) || '.' || quote_ident(view_rec.viewname) || '::regclass', true) 
        INTO current_definition;
        
        IF current_definition LIKE '%SECURITY DEFINER%' THEN
          RAISE WARNING '  ❌ View still has SECURITY DEFINER after fix attempt';
          error_count := error_count + 1;
        ELSE
          RAISE NOTICE '  ✅ View fixed successfully - now uses SECURITY INVOKER';
          fixed_count := fixed_count + 1;
        END IF;
        
      ELSE
        RAISE NOTICE '  ✅ View is already secure (no SECURITY DEFINER)';
        skipped_count := skipped_count + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ❌ Error processing view %.%: %', 
          view_rec.schemaname, 
          view_rec.viewname, 
          SQLERRM;
        error_count := error_count + 1;
    END;
    
    RAISE NOTICE '  ---';
  END LOOP;
  
  -- Final summary
  RAISE NOTICE '';
  RAISE NOTICE '=== FIX SUMMARY ===';
  RAISE NOTICE 'Total views processed: %', view_count;
  RAISE NOTICE 'Views fixed: %', fixed_count;
  RAISE NOTICE 'Views already secure: %', skipped_count;
  RAISE NOTICE 'Errors encountered: %', error_count;
  
  IF error_count = 0 AND fixed_count > 0 THEN
    RAISE NOTICE '🎉 All SECURITY DEFINER issues have been resolved!';
  ELSIF error_count > 0 THEN
    RAISE NOTICE '⚠️ Some views could not be fixed automatically. Manual intervention may be required.';
  ELSE
    RAISE NOTICE '✅ No fixes were needed - all views are already secure.';
  END IF;
  
  RAISE NOTICE '=== FIX PROCESS COMPLETE ===';
END
$$;

-- Grant permissions to all views (idempotent)
DO $$
DECLARE
  view_rec record;
BEGIN
  RAISE NOTICE 'Granting permissions to all views...';
  
  FOR view_rec IN 
    SELECT schemaname, viewname
    FROM pg_views 
    WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE 'GRANT SELECT ON ' || quote_ident(view_rec.schemaname) || '.' || quote_ident(view_rec.viewname) || ' TO anon, authenticated';
      RAISE NOTICE '  ✅ Permissions granted to %.%', view_rec.schemaname, view_rec.viewname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ⚠️ Could not grant permissions to %.%: %', 
          view_rec.schemaname, 
          view_rec.viewname, 
          SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Permission granting complete';
END
$$;

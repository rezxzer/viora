-- Safe check for all views in the database for security issues (idempotent)

-- Check all views and their security properties (safe query)
DO $$
DECLARE
  view_rec record;
  view_count integer := 0;
  problematic_count integer := 0;
  safe_count integer := 0;
BEGIN
  RAISE NOTICE '=== STARTING VIEW SECURITY ANALYSIS ===';
  
  -- First, get a count of all views
  SELECT COUNT(*) INTO view_count
  FROM pg_views 
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Total views found in public schema: %', view_count;
  
  IF view_count = 0 THEN
    RAISE NOTICE 'No views found in public schema';
    RETURN;
  END IF;
  
  -- Analyze each view safely
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
      IF view_rec.definition LIKE '%SECURITY DEFINER%' THEN
        problematic_count := problematic_count + 1;
        RAISE NOTICE '⚠️ PROBLEMATIC: %.% (Owner: %)', 
          view_rec.schemaname, 
          view_rec.viewname, 
          view_rec.viewowner;
        RAISE NOTICE '   Has SECURITY DEFINER - requires attention';
      ELSE
        safe_count := safe_count + 1;
        RAISE NOTICE '✅ SECURE: %.% (Owner: %)', 
          view_rec.schemaname, 
          view_rec.viewname, 
          view_rec.viewowner;
        RAISE NOTICE '   Uses SECURITY INVOKER (safe)';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR analyzing view %.%: %', 
          view_rec.schemaname, 
          view_rec.viewname, 
          SQLERRM;
    END;
  END LOOP;
  
  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '=== SECURITY ANALYSIS SUMMARY ===';
  RAISE NOTICE 'Total views analyzed: %', view_count;
  RAISE NOTICE 'Secure views: %', safe_count;
  RAISE NOTICE 'Problematic views: %', problematic_count;
  
  IF problematic_count = 0 THEN
    RAISE NOTICE '🎉 All views are secure! No action needed.';
  ELSE
    RAISE NOTICE '⚠️ % view(s) require attention to fix SECURITY DEFINER issues', problematic_count;
    RAISE NOTICE '   Run the appropriate fix scripts for each problematic view.';
  END IF;
  
  RAISE NOTICE '=== ANALYSIS COMPLETE ===';
END
$$;

-- Also show a simple summary table (if you want to see it in results)
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER - UNSAFE!'
    WHEN definition LIKE '%SECURITY INVOKER%' THEN 'SECURITY INVOKER - SAFE'
    ELSE 'DEFAULT (SECURITY INVOKER) - SAFE'
  END as security_status,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '⚠️ REQUIRES ATTENTION'
    ELSE '✅ SECURE'
  END as action_required
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 1
    ELSE 2
  END,
  viewname;

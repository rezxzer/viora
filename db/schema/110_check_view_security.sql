-- Check current security properties of v_comment_paid_reaction_stats view

-- Check if view exists and get its properties
DO $$
DECLARE
  view_exists boolean;
  view_owner text;
  view_security text;
BEGIN
  -- Check if view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'v_comment_paid_reaction_stats'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE 'View exists - checking properties...';
    
    -- Get view owner
    SELECT schemaname, tablename, tableowner 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'v_comment_paid_reaction_stats'
    INTO view_owner;
    
    RAISE NOTICE 'View owner: %', view_owner;
    
    -- Check if view has any special properties
    SELECT pg_get_viewdef('public.v_comment_paid_reaction_stats'::regclass, true) INTO view_security;
    RAISE NOTICE 'View definition: %', view_security;
    
  ELSE
    RAISE NOTICE 'View does not exist';
  END IF;
END
$$;

-- Alternative: Check view in pg_views
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'v_comment_paid_reaction_stats';



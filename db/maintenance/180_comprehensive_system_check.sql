-- Comprehensive System Check
-- This script checks all tables, relationships, RLS policies, and data integrity

-- ========================================
-- 1. CHECK ALL TABLES EXISTENCE
-- ========================================
SELECT 
  'TABLE EXISTENCE CHECK' as section,
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM (VALUES 
  ('profiles'),
  ('posts'),
  ('comments'),
  ('post_likes'),
  ('follows'),
  ('notifications'),
  ('reports'),
  ('post_views'),
  ('user_blocks'),
  ('events'),
  ('app_settings'),
  ('feature_flags')
) AS t(table_name);

-- ========================================
-- 2. CHECK TABLE STRUCTURES
-- ========================================
SELECT 
  'TABLE STRUCTURE CHECK' as section,
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 
  'TABLE STRUCTURE CHECK' as section,
  'posts' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

SELECT 
  'TABLE STRUCTURE CHECK' as section,
  'follows' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'follows' 
ORDER BY ordinal_position;

SELECT 
  'TABLE STRUCTURE CHECK' as section,
  'notifications' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- ========================================
-- 3. CHECK FOREIGN KEY RELATIONSHIPS
-- ========================================
SELECT 
  'FOREIGN KEY CHECK' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 4. CHECK RLS STATUS AND POLICIES
-- ========================================
SELECT 
  'RLS STATUS CHECK' as section,
  schemaname || '.' || tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 
  'RLS POLICIES CHECK' as section,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 5. CHECK TRIGGERS
-- ========================================
SELECT 
  'TRIGGERS CHECK' as section,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, trigger_name;

-- ========================================
-- 6. CHECK DATA INTEGRITY
-- ========================================
SELECT 
  'DATA INTEGRITY CHECK' as section,
  'profiles' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN username IS NULL THEN 1 END) as null_usernames
FROM public.profiles;

SELECT 
  'DATA INTEGRITY CHECK' as section,
  'posts' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN author_id IS NULL THEN 1 END) as null_author_ids,
  COUNT(CASE WHEN content IS NULL AND image_url IS NULL THEN 1 END) as empty_posts
FROM public.posts;

SELECT 
  'DATA INTEGRITY CHECK' as section,
  'follows' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN follower_id IS NULL THEN 1 END) as null_follower_ids,
  COUNT(CASE WHEN followee_id IS NULL THEN 1 END) as null_followee_ids
FROM public.follows;

SELECT 
  'DATA INTEGRITY CHECK' as section,
  'notifications' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
  COUNT(CASE WHEN type IS NULL THEN 1 END) as null_types
FROM public.notifications;

-- ========================================
-- 7. CHECK ORPHANED RECORDS
-- ========================================
SELECT 
  'ORPHANED RECORDS CHECK' as section,
  'posts without author' as issue,
  COUNT(*) as count
FROM public.posts p
LEFT JOIN auth.users u ON p.author_id = u.id
WHERE u.id IS NULL;

SELECT 
  'ORPHANED RECORDS CHECK' as section,
  'follows without follower' as issue,
  COUNT(*) as count
FROM public.follows f
LEFT JOIN auth.users u ON f.follower_id = u.id
WHERE u.id IS NULL;

SELECT 
  'ORPHANED RECORDS CHECK' as section,
  'follows without followee' as issue,
  COUNT(*) as count
FROM public.follows f
LEFT JOIN auth.users u ON f.followee_id = u.id
WHERE u.id IS NULL;

-- ========================================
-- 8. CHECK FUNCTIONS
-- ========================================
SELECT 
  'FUNCTIONS CHECK' as section,
  proname as function_name,
  prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('get_profile_stats', 'create_follow_notification', 'update_follow_counts')
ORDER BY proname;

-- ========================================
-- 9. CHECK INDEXES
-- ========================================
SELECT 
  'INDEXES CHECK' as section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 10. FINAL SUMMARY
-- ========================================
SELECT 
  'SYSTEM HEALTH SUMMARY' as section,
  'Total tables checked' as metric,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::text as value;

SELECT 
  'SYSTEM HEALTH SUMMARY' as section,
  'Total RLS policies' as metric,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text as value;

SELECT 
  'SYSTEM HEALTH SUMMARY' as section,
  'Total triggers' as metric,
  (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))::text as value;

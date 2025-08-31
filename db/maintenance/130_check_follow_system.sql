-- Check Follow System Status
-- This script checks the current state of follow functionality

-- 1. Check if follows table exists and has data
SELECT 
  'FOLLOWS TABLE STATUS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') 
    THEN (SELECT COUNT(*) FROM public.follows)::text
    ELSE 'N/A' 
  END as total_follows;

-- 2. Check follows table structure
SELECT 
  'FOLLOWS TABLE COLUMNS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'follows'
ORDER BY ordinal_position;

-- 3. Check follows table RLS policies
SELECT 
  'FOLLOWS TABLE POLICIES' as info,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'follows'
ORDER BY policyname;

-- 4. Check if RLS is enabled on follows table
SELECT 
  'FOLLOWS RLS STATUS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND table_name = 'follows';

-- 5. Check notifications table for follow notifications
SELECT 
  'NOTIFICATIONS TABLE STATUS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN (SELECT COUNT(*) FROM public.notifications)::text
    ELSE 'N/A' 
  END as total_notifications;

-- 6. Check notifications table structure
SELECT 
  'NOTIFICATIONS TABLE COLUMNS' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 7. Check if there are any existing follow relationships
SELECT 
  'EXISTING FOLLOWS' as info,
  COUNT(*) as total_follows,
  COUNT(DISTINCT follower_id) as unique_followers,
  COUNT(DISTINCT following_id) as unique_following
FROM public.follows;

-- 8. Check if there are any follow notifications
SELECT 
  'FOLLOW NOTIFICATIONS' as info,
  COUNT(*) as total_follow_notifications
FROM public.notifications 
WHERE type = 'follow' OR type LIKE '%follow%';

-- 9. Check profiles table for follower/following counts
SELECT 
  'PROFILES FOLLOW COUNTS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND (column_name LIKE '%follow%' OR column_name LIKE '%follower%')
ORDER BY column_name;

-- 10. Check if there are any triggers for follow notifications
SELECT 
  'FOLLOW TRIGGERS' as info,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%follow%' OR trigger_name LIKE '%notification%'
ORDER BY trigger_name;

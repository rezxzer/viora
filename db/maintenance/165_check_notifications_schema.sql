-- Check Notifications Table Schema
-- This script checks what columns the notifications table actually has

-- 1. Check if notifications table exists
SELECT 
  'NOTIFICATIONS TABLE EXISTS' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN 'YES' 
    ELSE 'NO' 
  END as status;

-- 2. Check notifications table columns
SELECT 
  'NOTIFICATIONS COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 3. Check notifications table data sample
SELECT 
  'NOTIFICATIONS DATA SAMPLE' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.notifications LIMIT 1) 
    THEN 'HAS DATA' 
    ELSE 'NO DATA' 
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.notifications LIMIT 1) 
    THEN (SELECT COUNT(*) FROM public.notifications)::text
    ELSE '0' 
  END as total_count;

-- 4. Show actual table structure
SELECT 
  'NOTIFICATIONS STRUCTURE' as section,
  'Use this to see actual table structure' as info,
  'Run: \d public.notifications' as command;

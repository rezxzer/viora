-- Check Existing Policies and Buckets
-- This script shows what already exists before we try to fix anything

-- 1. Check existing storage buckets
SELECT 
  'EXISTING STORAGE BUCKETS' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
ORDER BY id;

-- 2. Check existing storage policies
SELECT 
  'EXISTING STORAGE POLICIES' as section,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%post%' OR policyname LIKE '%avatar%'
ORDER BY policyname;

-- 3. Check all storage policies (broader view)
SELECT 
  'ALL STORAGE POLICIES' as section,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Check table structures
SELECT 
  'POSTS TABLE COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

SELECT 
  'POST_ASSETS TABLE COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'post_assets'
ORDER BY ordinal_position;

SELECT 
  'PROFILES TABLE COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check table RLS policies
SELECT 
  'TABLE RLS POLICIES' as section,
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('post_assets', 'profiles', 'posts')
ORDER BY tablename, policyname;

-- 6. Check if RLS is enabled on tables
SELECT 
  'RLS STATUS' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('post_assets', 'profiles', 'posts')
ORDER BY tablename;

-- 7. Check existing data counts
SELECT 
  'DATA COUNTS' as section,
  'posts' as table_name,
  COUNT(*) as total_rows
FROM public.posts
UNION ALL
SELECT 
  'DATA COUNTS' as section,
  'post_assets' as table_name,
  COUNT(*) as total_rows
FROM public.post_assets
UNION ALL
SELECT 
  'DATA COUNTS' as section,
  'profiles' as table_name,
  COUNT(*) as total_rows
FROM public.profiles;

-- 8. Check storage objects count
SELECT 
  'STORAGE OBJECTS COUNT' as section,
  bucket_id,
  COUNT(*) as total_files,
  COUNT(CASE WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp' THEN 1 END) as image_files,
  COUNT(CASE WHEN name LIKE '%.mp4' OR name LIKE '%.mov' OR name LIKE '%.avi' OR name LIKE '%.webm' THEN 1 END) as video_files
FROM storage.objects 
WHERE bucket_id IN ('post-media', 'avatars')
GROUP BY bucket_id
ORDER BY bucket_id;

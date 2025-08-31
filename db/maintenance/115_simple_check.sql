-- Simple Check for Upload Issues
-- Run each section separately to avoid UNION errors

-- 1. Check storage buckets
SELECT 
  'STORAGE BUCKETS' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
ORDER BY id;

-- 2. Check storage policies
SELECT 
  'STORAGE POLICIES' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%post%' OR policyname LIKE '%avatar%')
ORDER BY policyname;

-- 3. Check posts table
SELECT 
  'POSTS TABLE' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- 4. Check post_assets table
SELECT 
  'POST_ASSETS TABLE' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'post_assets'
ORDER BY ordinal_position;

-- 5. Check profiles table
SELECT 
  'PROFILES TABLE' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check table policies
SELECT 
  'TABLE POLICIES' as info,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('post_assets', 'profiles', 'posts')
ORDER BY tablename, policyname;

-- 7. Check posts count
SELECT 
  'POSTS COUNT' as info,
  COUNT(*) as total_posts
FROM public.posts;

-- 8. Check post_assets count
SELECT 
  'ASSETS COUNT' as info,
  COUNT(*) as total_assets
FROM public.post_assets;

-- 9. Check profiles count
SELECT 
  'PROFILES COUNT' as info,
  COUNT(*) as total_profiles
FROM public.profiles;

-- 10. Check avatars count
SELECT 
  'AVATARS COUNT' as info,
  COUNT(*) as total_avatars
FROM storage.objects 
WHERE bucket_id = 'avatars';

-- 11. Check post-media count
SELECT 
  'POST-MEDIA COUNT' as info,
  COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'post-media';

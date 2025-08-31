-- Fix Avatar Upload Issues
-- This script specifically addresses avatar upload problems

-- 1. Ensure avatars bucket exists and is properly configured
DO $$
BEGIN
  -- Check if avatars bucket exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    -- Create avatars bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      5242880, -- 5MB limit
      ARRAY['image/*']
    );
    RAISE NOTICE 'Created avatars bucket';
  ELSE
    RAISE NOTICE 'avatars bucket already exists';
  END IF;
END $$;

-- 2. Clean up any conflicting avatar policies
DO $$
BEGIN
  -- Drop all existing conflicting avatar policies
  DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_delete_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
  DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own_folder ON storage.objects;
  
  RAISE NOTICE 'Cleaned up old avatar policies';
END $$;

-- 3. Create correct avatar storage policies
DO $$
BEGIN
  -- Public read access to avatars
  CREATE POLICY avatars_select_public ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');
    
  -- Authenticated users can insert into their own folder
  CREATE POLICY avatars_insert_own ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  -- Authenticated users can update their own avatars
  CREATE POLICY avatars_update_own ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  -- Authenticated users can delete their own avatars
  CREATE POLICY avatars_delete_own ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  RAISE NOTICE 'Created new avatar storage policies';
END $$;

-- 4. Ensure profiles table has avatar_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE 'Added avatar_url column to profiles table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in profiles table';
  END IF;
END $$;

-- 5. Fix profiles RLS policies for avatar updates
DO $$
BEGIN
  -- Drop conflicting policies first
  DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
  DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
  
  -- Create correct policies
  CREATE POLICY profiles_select_public ON public.profiles
    FOR SELECT USING (true);
    
  CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    
  RAISE NOTICE 'Fixed profiles RLS policies';
END $$;

-- 6. Verification queries
-- Check avatars bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- Check avatar storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'avatars%'
ORDER BY policyname;

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'avatar_url';

-- Check profiles policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- Check if there are any existing avatars
SELECT 
  COUNT(*) as total_avatars,
  COUNT(CASE WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp' THEN 1 END) as image_files
FROM storage.objects 
WHERE bucket_id = 'avatars';

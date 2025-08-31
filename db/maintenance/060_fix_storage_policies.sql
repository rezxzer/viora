-- Fix and update storage policies for post media
-- This script ensures all storage policies are correctly configured

-- First, let's clean up any duplicate or conflicting policies
DO $$
BEGIN
  -- Drop all existing policies for post-media bucket
  DROP POLICY IF EXISTS post_media_delete_own_folder ON storage.objects;
  DROP POLICY IF EXISTS post_media_insert_own_folder ON storage.objects;
  DROP POLICY IF EXISTS post_media_select_public ON storage.objects;
  DROP POLICY IF EXISTS post_media_update_own_folder ON storage.objects;
  DROP POLICY IF EXISTS postmedia_delete_own ON storage.objects;
  DROP POLICY IF EXISTS postmedia_insert_own ON storage.objects;
  DROP POLICY IF EXISTS postmedia_public_read ON storage.objects;
  DROP POLICY IF EXISTS postmedia_update_own ON storage.objects;
  
  RAISE NOTICE 'Cleaned up old post-media policies';
END $$;

-- Now create the correct policies for post-media bucket
DO $$
BEGIN
  -- Public read access to post-media
  CREATE POLICY post_media_select_public ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'post-media');
    
  -- Authenticated users can insert into their own folder
  CREATE POLICY post_media_insert_own ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  -- Authenticated users can update their own files
  CREATE POLICY post_media_update_own ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  -- Authenticated users can delete their own files
  CREATE POLICY post_media_delete_own ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  RAISE NOTICE 'Created new post-media policies';
END $$;

-- Also ensure avatars policies are correct
DO $$
BEGIN
  -- Drop any conflicting avatars policies
  DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_delete_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
  DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own_folder ON storage.objects;
  
  -- Create correct avatars policies
  CREATE POLICY avatars_select_public ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
    
  CREATE POLICY avatars_insert_own ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  CREATE POLICY avatars_update_own ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  CREATE POLICY avatars_delete_own ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  RAISE NOTICE 'Created new avatars policies';
END $$;

-- Verify all policies are in place
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
ORDER BY policyname;

-- Fix Video Upload System - Comprehensive Fix
-- This script addresses all issues with video uploads and media handling

-- 1. Ensure storage buckets exist and are properly configured
DO $$
BEGIN
  -- Check if post-media bucket exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'post-media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'post-media',
      'post-media',
      true,
      15728640, -- 15MB limit
      ARRAY['image/*', 'video/*']
    );
    RAISE NOTICE 'Created post-media bucket';
  ELSE
    RAISE NOTICE 'post-media bucket already exists';
  END IF;
  
  -- Check if avatars bucket exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
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

-- 2. Fix post_assets table structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_assets'
  ) THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'id'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN id uuid DEFAULT gen_random_uuid();
      RAISE NOTICE 'Added id column to post_assets table';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'mime_type'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN mime_type text;
      RAISE NOTICE 'Added mime_type column to post_assets table';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN created_at timestamptz DEFAULT now();
      RAISE NOTICE 'Added created_at column to post_assets table';
    END IF;
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE public.post_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
      url text NOT NULL,
      mime_type text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_post_assets_post_id ON public.post_assets(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_assets_mime ON public.post_assets(mime_type);
    
    ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Created post_assets table';
  END IF;
END $$;

-- 3. Fix posts table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN image_url text;
    RAISE NOTICE 'Added image_url column to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN content text;
    RAISE NOTICE 'Added content column to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN author_id uuid REFERENCES public.profiles(id);
    RAISE NOTICE 'Added author_id column to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added created_at column to posts table';
  END IF;
END $$;

-- 4. Clean up and recreate storage policies
DO $$
BEGIN
  -- Drop all existing conflicting policies
  DROP POLICY IF EXISTS post_media_delete_own_folder ON storage.objects;
  DROP POLICY IF EXISTS post_media_insert_own_folder ON storage.objects;
  DROP POLICY IF EXISTS post_media_select_public ON storage.objects;
  DROP POLICY IF EXISTS post_media_update_own_folder ON storage.objects;
  DROP POLICY IF EXISTS postmedia_delete_own ON storage.objects;
  DROP POLICY IF EXISTS postmedia_insert_own ON storage.objects;
  DROP POLICY IF EXISTS postmedia_public_read ON storage.objects;
  DROP POLICY IF EXISTS postmedia_update_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_delete_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_insert_own_folder ON storage.objects;
  DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
  DROP POLICY IF EXISTS avatars_select_public ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
  DROP POLICY IF EXISTS avatars_update_own_folder ON storage.objects;
  
  RAISE NOTICE 'Cleaned up old storage policies';
END $$;

-- 5. Create correct storage policies
DO $$
BEGIN
  -- Post-media policies
  CREATE POLICY post_media_select_public ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'post-media');
    
  CREATE POLICY post_media_insert_own ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  CREATE POLICY post_media_update_own ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  CREATE POLICY post_media_delete_own ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'post-media' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  -- Avatars policies
  CREATE POLICY avatars_select_public ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');
    
  CREATE POLICY avatars_insert_own ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
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
    
  CREATE POLICY avatars_delete_own ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'avatars' 
      AND split_part(name, '/', 1) = auth.uid()::text
    );
    
  RAISE NOTICE 'Created new storage policies';
END $$;

-- 6. Fix post_assets RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS post_assets_select_public ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_insert_author ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_delete_author ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_select_all ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_insert_own ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_update_own ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_delete_own ON public.post_assets;
  
  CREATE POLICY post_assets_select_all ON public.post_assets
    FOR SELECT USING (true);
    
  CREATE POLICY post_assets_insert_own ON public.post_assets
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
    ));
    
  CREATE POLICY post_assets_update_own ON public.post_assets
    FOR UPDATE USING (EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
    ));
    
  CREATE POLICY post_assets_delete_own ON public.post_assets
    FOR DELETE USING (EXISTS (
      SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
    ));
    
  RAISE NOTICE 'Fixed post_assets RLS policies';
END $$;

-- 7. Verification queries
-- Check storage buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
ORDER BY id;

-- Check post_assets table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'post_assets'
ORDER BY ordinal_position;

-- Check posts table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- Check storage policies
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

-- Check post_assets policies
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
WHERE tablename = 'post_assets' 
AND schemaname = 'public'
ORDER BY policyname;

-- Check existing data
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as posts_with_image_url,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as posts_with_content
FROM public.posts;

SELECT 
  COUNT(*) as total_assets,
  COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
  COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count
FROM public.post_assets;

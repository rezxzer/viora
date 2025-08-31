-- Complete Fix for All Upload Issues (Avatars + Videos)
-- This script fixes avatar upload problems and ensures video uploads work

-- 1. Fix Storage Buckets
DO $$
BEGIN
  -- Fix post-media bucket
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
  
  -- Fix avatars bucket
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

-- 2. Fix Database Tables
DO $$
BEGIN
  -- Fix posts table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN image_url text;
    RAISE NOTICE 'Added image_url to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN content text;
    RAISE NOTICE 'Added content to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN author_id uuid REFERENCES public.profiles(id);
    RAISE NOTICE 'Added author_id to posts table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added created_at to posts table';
  END IF;
  
  -- Fix post_assets table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_assets'
  ) THEN
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
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'id'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN id uuid DEFAULT gen_random_uuid();
      RAISE NOTICE 'Added id to post_assets table';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'mime_type'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN mime_type text;
      RAISE NOTICE 'Added mime_type to post_assets table';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.post_assets ADD COLUMN created_at timestamptz DEFAULT now();
      RAISE NOTICE 'Added created_at to post_assets table';
    END IF;
  END IF;
  
  -- Fix profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    RAISE NOTICE 'Added avatar_url to profiles table';
  END IF;
END $$;

-- 3. Clean up ALL conflicting storage policies
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
  
  RAISE NOTICE 'Cleaned up ALL conflicting storage policies';
END $$;

-- 4. Create correct storage policies
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
    
  -- Avatar policies
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
    
  RAISE NOTICE 'Created ALL storage policies';
END $$;

-- 5. Fix RLS policies for tables
DO $$
BEGIN
  -- Fix post_assets policies
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
    
  -- Fix profiles policies
  DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
  DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
  
  CREATE POLICY profiles_select_public ON public.profiles
    FOR SELECT USING (true);
    
  CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    
  RAISE NOTICE 'Fixed ALL table RLS policies';
END $$;

-- 6. Verification and Status
-- Check storage buckets
SELECT 
  'STORAGE BUCKETS' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
ORDER BY id;

-- Check table structures
SELECT 
  'POSTS TABLE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

SELECT 
  'POST_ASSETS TABLE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'post_assets'
ORDER BY ordinal_position;

SELECT 
  'PROFILES TABLE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'avatar_url';

-- Check storage policies
SELECT 
  'STORAGE POLICIES' as section,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Check table policies
SELECT 
  'TABLE POLICIES' as section,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('post_assets', 'profiles')
ORDER BY tablename, policyname;

-- Check existing data
SELECT 
  'POSTS COUNT' as section,
  COUNT(*) as total_posts,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as posts_with_image_url,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as posts_with_content
FROM public.posts;

SELECT 
  'ASSETS COUNT' as section,
  COUNT(*) as total_assets,
  COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
  COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count
FROM public.post_assets;

SELECT 
  'AVATARS COUNT' as section,
  COUNT(*) as total_avatars,
  COUNT(CASE WHEN name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp' THEN 1 END) as image_files
FROM storage.objects 
WHERE bucket_id = 'avatars';

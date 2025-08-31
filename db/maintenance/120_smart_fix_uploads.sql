-- Smart Fix for Upload Issues
-- This script only creates/fixes what's actually needed

-- 1. Fix Storage Buckets (only if missing)
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

-- 2. Fix Database Tables (only if missing)
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

-- 3. Smart Storage Policy Management
DO $$
BEGIN
  -- Only create post-media policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'post_media_select_public'
  ) THEN
    CREATE POLICY post_media_select_public ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'post-media');
    RAISE NOTICE 'Created post_media_select_public policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'post_media_insert_own'
  ) THEN
    CREATE POLICY post_media_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'post-media' 
        AND split_part(name, '/', 1) = auth.uid()::text
      );
    RAISE NOTICE 'Created post_media_insert_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'post_media_update_own'
  ) THEN
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
    RAISE NOTICE 'Created post_media_update_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'post_media_delete_own'
  ) THEN
    CREATE POLICY post_media_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'post-media' 
        AND split_part(name, '/', 1) = auth.uid()::text
      );
    RAISE NOTICE 'Created post_media_delete_own policy';
  END IF;
  
  -- Only create avatar policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'avatars_select_public'
  ) THEN
    CREATE POLICY avatars_select_public ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
    RAISE NOTICE 'Created avatars_select_public policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'avatars_insert_own'
  ) THEN
    CREATE POLICY avatars_insert_own ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars' 
        AND split_part(name, '/', 1) = auth.uid()::text
      );
    RAISE NOTICE 'Created avatars_insert_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'avatars_update_own'
  ) THEN
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
    RAISE NOTICE 'Created avatars_update_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'avatars_delete_own'
  ) THEN
    CREATE POLICY avatars_delete_own ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars' 
        AND split_part(name, '/', 1) = auth.uid()::text
      );
    RAISE NOTICE 'Created avatars_delete_own policy';
  END IF;
END $$;

-- 4. Smart Table RLS Policy Management
DO $$
BEGIN
  -- Only create post_assets policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_assets' 
    AND schemaname = 'public'
    AND policyname = 'post_assets_select_all'
  ) THEN
    CREATE POLICY post_assets_select_all ON public.post_assets
      FOR SELECT USING (true);
    RAISE NOTICE 'Created post_assets_select_all policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_assets' 
    AND schemaname = 'public'
    AND policyname = 'post_assets_insert_own'
  ) THEN
    CREATE POLICY post_assets_insert_own ON public.post_assets
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
      ));
    RAISE NOTICE 'Created post_assets_insert_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_assets' 
    AND schemaname = 'public'
    AND policyname = 'post_assets_update_own'
  ) THEN
    CREATE POLICY post_assets_update_own ON public.post_assets
      FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
      ));
    RAISE NOTICE 'Created post_assets_update_own policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'post_assets' 
    AND schemaname = 'public'
    AND policyname = 'post_assets_delete_own'
  ) THEN
    CREATE POLICY post_assets_delete_own ON public.post_assets
      FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()
      ));
    RAISE NOTICE 'Created post_assets_delete_own policy';
  END IF;
  
  -- Only create profiles policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
    AND policyname = 'profiles_select_public'
  ) THEN
    CREATE POLICY profiles_select_public ON public.profiles
      FOR SELECT USING (true);
    RAISE NOTICE 'Created profiles_select_public policy';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
    AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    RAISE NOTICE 'Created profiles_update_own policy';
  END IF;
END $$;

-- 5. Final Status Check
SELECT 
  'FINAL STATUS' as section,
  'Storage Buckets' as item,
  COUNT(*) as count
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
UNION ALL
SELECT 
  'FINAL STATUS' as section,
  'Storage Policies' as item,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%post%' OR policyname LIKE '%avatar%')
UNION ALL
SELECT 
  'FINAL STATUS' as section,
  'Table Policies' as item,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('post_assets', 'profiles')
UNION ALL
SELECT 
  'FINAL STATUS' as section,
  'Avatar Files' as item,
  COUNT(*) as count
FROM storage.objects 
WHERE bucket_id = 'avatars';

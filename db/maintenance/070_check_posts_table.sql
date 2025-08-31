-- Check and fix posts table structure
-- This script ensures the posts table has all necessary columns for media support

DO $$
BEGIN
  -- Check if image_url column exists, add if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN image_url text;
    RAISE NOTICE 'Added image_url column to posts table';
  ELSE
    RAISE NOTICE 'image_url column already exists in posts table';
  END IF;
  
  -- Check if content column exists, add if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN content text;
    RAISE NOTICE 'Added content column to posts table';
  ELSE
    RAISE NOTICE 'content column already exists in posts table';
  END IF;
  
  -- Check if author_id column exists, add if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'author_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN author_id uuid REFERENCES public.profiles(id);
    RAISE NOTICE 'Added author_id column to posts table';
  ELSE
    RAISE NOTICE 'author_id column already exists in posts table';
  END IF;
  
  -- Check if created_at column exists, add if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Added created_at column to posts table';
  ELSE
    RAISE NOTICE 'created_at column already exists in posts table';
  END IF;
END $$;

-- Verify posts table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- Check if there are any existing posts with media
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as posts_with_image_url,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as posts_with_content
FROM public.posts;

-- Check if there are any posts with assets
SELECT 
  p.id,
  p.content,
  p.image_url,
  p.created_at,
  COUNT(pa.id) as asset_count
FROM public.posts p
LEFT JOIN public.post_assets pa ON p.id = pa.post_id
GROUP BY p.id, p.content, p.image_url, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;

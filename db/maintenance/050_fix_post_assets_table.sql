-- Fix post_assets table structure and ensure it's properly configured
-- This script checks for duplicate table definitions and fixes any issues

-- First, let's check if there are duplicate table definitions
DO $$
BEGIN
  -- Check if there are multiple post_assets tables or conflicting definitions
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_assets'
  ) THEN
    RAISE NOTICE 'post_assets table exists';
    
    -- Check if the table has the correct structure
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'id'
    ) THEN
      -- Add id column if it doesn't exist
      ALTER TABLE public.post_assets ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
      RAISE NOTICE 'Added id column to post_assets table';
    END IF;
    
    -- Check if the table has the correct structure
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'mime_type'
    ) THEN
      -- Add mime_type column if it doesn't exist
      ALTER TABLE public.post_assets ADD COLUMN IF NOT EXISTS mime_type text;
      RAISE NOTICE 'Added mime_type column to post_assets table';
    END IF;
    
    -- Check if the table has the correct structure
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'post_assets' 
      AND column_name = 'created_at'
    ) THEN
      -- Add created_at column if it doesn't exist
      ALTER TABLE public.post_assets ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      RAISE NOTICE 'Added created_at column to post_assets table';
    END IF;
    
  ELSE
    RAISE NOTICE 'post_assets table does not exist, creating it';
    
    -- Create the table with the correct structure
    CREATE TABLE public.post_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
      url text NOT NULL,
      mime_type text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_post_assets_post_id ON public.post_assets(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_assets_mime ON public.post_assets(mime_type);
    
    -- Enable RLS
    ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Created post_assets table with correct structure';
  END IF;
END $$;

-- Ensure RLS policies are correct
DO $$
BEGIN
  -- Drop any conflicting policies first
  DROP POLICY IF EXISTS post_assets_select_public ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_insert_author ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_delete_author ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_select_all ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_insert_own ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_update_own ON public.post_assets;
  DROP POLICY IF EXISTS post_assets_delete_own ON public.post_assets;
  
  -- Create the correct policies
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
    
  RAISE NOTICE 'Updated RLS policies for post_assets table';
END $$;

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'post_assets'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT COUNT(*) as total_assets,
       COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
       COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count
FROM public.post_assets;

-- Check and create storage buckets for post media
-- This script ensures the required storage buckets exist and are properly configured

-- Check if post-media bucket exists, create if not
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'post-media'
  ) THEN
    -- Create post-media bucket
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

-- Verify bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('post-media', 'avatars')
ORDER BY id;

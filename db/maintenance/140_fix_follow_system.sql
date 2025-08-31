-- Fix Follow System
-- This script adds missing columns and triggers for follow functionality

-- 1. Add follower/following count columns to profiles table
DO $$
BEGIN
  -- Add followers_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN followers_count integer DEFAULT 0;
    RAISE NOTICE 'Added followers_count to profiles table';
  ELSE
    RAISE NOTICE 'followers_count column already exists';
  END IF;
  
  -- Add following_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'following_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN following_count integer DEFAULT 0;
    RAISE NOTICE 'Added following_count to profiles table';
  ELSE
    RAISE NOTICE 'following_count column already exists';
  END IF;
END $$;

-- 2. Create function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for following
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.followee_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for following
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.followee_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for follow counts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_follow_counts'
  ) THEN
    CREATE TRIGGER trigger_update_follow_counts
      AFTER INSERT OR DELETE ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION update_follow_counts();
    RAISE NOTICE 'Created follow counts trigger';
  ELSE
    RAISE NOTICE 'Follow counts trigger already exists';
  END IF;
END $$;

-- 4. Create function to create follow notification
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification when someone follows
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    created_at
  ) VALUES (
    NEW.followee_id, -- The person being followed
    'follow',
    'New Follower',
    'Someone started following you',
    NEW.follower_id, -- The person who followed
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for follow notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_create_follow_notification'
  ) THEN
    CREATE TRIGGER trigger_create_follow_notification
      AFTER INSERT ON public.follows
      FOR EACH ROW
      EXECUTE FUNCTION create_follow_notification();
    RAISE NOTICE 'Created follow notification trigger';
  ELSE
    RAISE NOTICE 'Follow notification trigger already exists';
  END IF;
END $$;

-- 6. Update existing profiles with correct counts
UPDATE public.profiles 
SET 
  followers_count = (
    SELECT COUNT(*) FROM public.follows WHERE followee_id = profiles.id
  ),
  following_count = (
    SELECT COUNT(*) FROM public.follows WHERE follower_id = profiles.id
  );

-- 7. Final status check
SELECT 
  'FOLLOW SYSTEM STATUS' as info,
  'Profiles with follow columns' as item,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('followers_count', 'following_count')
UNION ALL
SELECT 
  'FOLLOW SYSTEM STATUS' as info,
  'Follow triggers' as item,
  COUNT(*) as count
FROM pg_trigger 
WHERE tgname LIKE '%follow%'
UNION ALL
SELECT 
  'FOLLOW SYSTEM STATUS' as info,
  'Total follows' as item,
  COUNT(*) as count
FROM public.follows
UNION ALL
SELECT 
  'FOLLOW SYSTEM STATUS' as info,
  'Profiles with followers' as item,
  COUNT(*) as count
FROM public.profiles 
WHERE followers_count > 0;

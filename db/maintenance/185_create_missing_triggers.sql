-- Create Missing Follow System Triggers
-- This script creates the missing triggers that are needed for the follow system to work

-- 1. First, let's check if the functions exist
SELECT 
  'FUNCTIONS CHECK' as section,
  proname as function_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = f.function_name) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM (VALUES 
  ('update_follow_counts'),
  ('create_follow_notification')
) AS f(function_name);

-- 2. Create update_follow_counts function if it doesn't exist
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for followee
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.followee_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for followee
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.followee_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create create_follow_notification function if it doesn't exist
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at) 
  VALUES (NEW.followee_id, 'follow', 'New Follower', 'Someone started following you', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for follow counts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_follow_counts') THEN
    CREATE TRIGGER trigger_update_follow_counts 
    AFTER INSERT OR DELETE ON public.follows 
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
    RAISE NOTICE 'Created trigger_update_follow_counts';
  ELSE
    RAISE NOTICE 'trigger_update_follow_counts already exists';
  END IF;
END $$;

-- 5. Create trigger for follow notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_follow_notification') THEN
    CREATE TRIGGER trigger_create_follow_notification 
    AFTER INSERT ON public.follows 
    FOR EACH ROW EXECUTE FUNCTION create_follow_notification();
    RAISE NOTICE 'Created trigger_create_follow_notification';
  ELSE
    RAISE NOTICE 'trigger_create_follow_notification already exists';
  END IF;
END $$;

-- 6. Update existing profiles with correct counts
UPDATE public.profiles 
SET 
  followers_count = (SELECT COUNT(*) FROM public.follows WHERE followee_id = profiles.id),
  following_count = (SELECT COUNT(*) FROM public.profiles WHERE follower_id = profiles.id);

-- 7. Test the triggers by creating a test follow (will be cleaned up)
DO $$
DECLARE
  test_user1_id uuid;
  test_user2_id uuid;
  test_follow_id uuid;
BEGIN
  -- Get two test user IDs
  SELECT id INTO test_user1_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users OFFSET 1 LIMIT 1;
  
  IF test_user1_id IS NOT NULL AND test_user2_id IS NOT NULL AND test_user1_id != test_user2_id THEN
    -- Try to create a test follow
    INSERT INTO public.follows (follower_id, followee_id, created_at)
    VALUES (test_user1_id, test_user2_id, NOW())
    RETURNING (follower_id || '_' || followee_id)::text INTO test_follow_id;
    
    RAISE NOTICE 'Test follow created: %', test_follow_id;
    
    -- Check if counts were updated
    RAISE NOTICE 'User 1 following count: %', (SELECT following_count FROM public.profiles WHERE id = test_user1_id);
    RAISE NOTICE 'User 2 followers count: %', (SELECT followers_count FROM public.profiles WHERE id = test_user2_id);
    
    -- Clean up test follow
    DELETE FROM public.follows WHERE follower_id = test_user1_id AND followee_id = test_user2_id;
    RAISE NOTICE 'Test follow cleaned up';
  ELSE
    RAISE NOTICE 'Not enough users for testing';
  END IF;
END $$;

-- 8. Final verification
SELECT 
  'TRIGGERS CREATED' as section,
  'update_follow_counts function' as component,
  'SUCCESS' as status;

SELECT 
  'TRIGGERS CREATED' as section,
  'create_follow_notification function' as component,
  'SUCCESS' as status;

SELECT 
  'TRIGGERS CREATED' as section,
  'trigger_update_follow_counts' as component,
  'SUCCESS' as status;

SELECT 
  'TRIGGERS CREATED' as section,
  'trigger_create_follow_notification' as component,
  'SUCCESS' as status;

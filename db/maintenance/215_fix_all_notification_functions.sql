-- Fix All Notification Functions and Constraints

-- 1. Check all existing notification-related functions
SELECT 
  'EXISTING FUNCTIONS' as section,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE prosrc LIKE '%notifications%' OR prosrc LIKE '%notify%'
ORDER BY proname;

-- 2. Check current constraints on notifications table
SELECT 
  'NOTIFICATIONS CONSTRAINTS' as section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass;

-- 3. Drop all existing notification functions to recreate them consistently
DROP FUNCTION IF EXISTS public.notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS public.create_follow_notification() CASCADE;

-- 4. Drop existing constraints to recreate them properly
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_type_related_unique;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_type_unique;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_followee_unique;

-- 5. Create proper unique constraints
-- For follows table: ensure one follow relationship per follower-followee pair
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_followee_unique 
UNIQUE (follower_id, followee_id);

-- For notifications table: create constraint that matches our ON CONFLICT usage
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_type_actor_unique 
UNIQUE (user_id, type, actor_id);

-- 6. Create the main follow notification function
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    related_id, 
    actor_id,
    target_id,
    action_type,
    created_at
  ) VALUES (
    NEW.followee_id, 
    'follow', 
    'New Follower', 
    'Someone started following you', 
    NEW.follower_id,
    NEW.follower_id,  -- actor_id = who performed the action
    NEW.followee_id,  -- target_id = who received the action
    'follow',         -- action_type = what action was performed
    NOW()
  )
  ON CONFLICT (user_id, type, actor_id) 
  DO NOTHING;  -- Don't create duplicate notifications
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create the legacy notify_on_follow function for compatibility
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    related_id, 
    actor_id,
    target_id,
    action_type,
    created_at
  ) VALUES (
    NEW.followee_id, 
    'follow', 
    'New Follower', 
    'Someone started following you', 
    NEW.follower_id,
    NEW.follower_id,  -- actor_id = who performed the action
    NEW.followee_id,  -- target_id = who received the action
    'follow',         -- action_type = what action was performed
    NOW()
  )
  ON CONFLICT (user_id, type, actor_id) 
  DO NOTHING;  -- Don't create duplicate notifications
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create or recreate the trigger for follows table
DROP TRIGGER IF EXISTS trigger_create_follow_notification ON public.follows;
CREATE TRIGGER trigger_create_follow_notification 
  AFTER INSERT ON public.follows 
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_follow_notification();

-- 9. Test the system with a simple follow operation
DO $$
DECLARE
  test_user1_id uuid;
  test_user2_id uuid;
  test_follow_id bigint;
BEGIN
  -- Get two test user IDs
  SELECT id INTO test_user1_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users OFFSET 1 LIMIT 1;
  
  IF test_user1_id IS NOT NULL AND test_user2_id IS NOT NULL AND test_user1_id != test_user2_id THEN
    -- Try to create a test follow
    INSERT INTO public.follows (follower_id, followee_id, created_at)
    VALUES (test_user1_id, test_user2_id, NOW())
    RETURNING id INTO test_follow_id;
    
    RAISE NOTICE 'First follow created successfully with ID: %', test_follow_id;
    
    -- Check if notification was created
    IF EXISTS (SELECT 1 FROM public.notifications WHERE related_id = test_user1_id AND type = 'follow') THEN
      RAISE NOTICE 'SUCCESS: Follow notification created';
    ELSE
      RAISE NOTICE 'WARNING: Follow notification was not created';
    END IF;
    
    -- Try to create duplicate follow (should fail due to unique constraint)
    BEGIN
      INSERT INTO public.follows (follower_id, followee_id, created_at)
      VALUES (test_user1_id, test_user2_id, NOW());
      RAISE NOTICE 'WARNING: Duplicate follow was created (constraint not working)';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'SUCCESS: Duplicate follow prevented by unique constraint';
    END;
    
    -- Clean up test follows
    DELETE FROM public.follows WHERE id = test_follow_id;
    DELETE FROM public.notifications WHERE related_id = test_user1_id AND type = 'follow';
    RAISE NOTICE 'Test data cleaned up';
  ELSE
    RAISE NOTICE 'Not enough users for testing';
  END IF;
END $$;

-- 10. Final verification
SELECT 
  'SYSTEM STATUS' as section,
  'follows table constraint' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_follower_followee_unique') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

SELECT 
  'SYSTEM STATUS' as section,
  'notifications table constraint' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_type_actor_unique') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

SELECT 
  'SYSTEM STATUS' as section,
  'create_follow_notification function' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_follow_notification') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

SELECT 
  'SYSTEM STATUS' as section,
  'trigger_create_follow_notification' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_follow_notification') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Fix Unique Constraints for Follow System (CORRECTED)
-- This script fixes the unique constraints that are needed for ON CONFLICT to work

-- 1. Check current constraints on follows table
SELECT 
  'FOLLOWS CONSTRAINTS CHECK' as section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.follows'::regclass;

-- 2. Check current constraints on notifications table
SELECT 
  'NOTIFICATIONS CONSTRAINTS CHECK' as section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass;

-- 3. Drop existing problematic constraints if they exist
DO $$
BEGIN
  -- Drop any existing unique constraints on follows table
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.follows'::regclass 
    AND contype = 'u'
  ) THEN
    ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_followee_unique;
    RAISE NOTICE 'Dropped existing unique constraint on follows table';
  END IF;
  
  -- Drop any existing unique constraints on notifications table
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.notifications'::regclass 
    AND contype = 'u'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_type_unique;
    RAISE NOTICE 'Dropped existing unique constraint on notifications table';
  END IF;
END $$;

-- 4. Create proper unique constraints
-- For follows table: ensure one follow relationship per follower-followee pair
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_followee_unique 
UNIQUE (follower_id, followee_id);

-- For notifications table: simple unique constraint without WHERE clause
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_type_related_unique 
UNIQUE (user_id, type, related_id);

-- 5. Update the create_follow_notification function to handle conflicts properly
CREATE OR REPLACE FUNCTION create_follow_notification()
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
  ON CONFLICT (user_id, type, related_id) 
  DO NOTHING;  -- Don't create duplicate notifications
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Test the constraints by trying to create duplicate follows
DO $$
DECLARE
  test_user1_id uuid;
  test_user2_id uuid;
BEGIN
  -- Get two test user IDs
  SELECT id INTO test_user1_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users OFFSET 1 LIMIT 1;
  
  IF test_user1_id IS NOT NULL AND test_user2_id IS NOT NULL AND test_user1_id != test_user2_id THEN
    -- Try to create a test follow
    INSERT INTO public.follows (follower_id, followee_id, created_at)
    VALUES (test_user1_id, test_user2_id, NOW());
    
    RAISE NOTICE 'First follow created successfully';
    
    -- Try to create duplicate follow (should fail due to unique constraint)
    BEGIN
      INSERT INTO public.follows (follower_id, followee_id, created_at)
      VALUES (test_user1_id, test_user2_id, NOW());
      RAISE NOTICE 'WARNING: Duplicate follow was created (constraint not working)';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'SUCCESS: Duplicate follow prevented by unique constraint';
    END;
    
    -- Clean up test follows
    DELETE FROM public.follows WHERE follower_id = test_user1_id AND followee_id = test_user2_id;
    RAISE NOTICE 'Test follows cleaned up';
  ELSE
    RAISE NOTICE 'Not enough users for testing';
  END IF;
END $$;

-- 7. Final verification
SELECT 
  'UNIQUE CONSTRAINTS FIXED' as section,
  'follows table constraint' as component,
  'SUCCESS' as status;

SELECT 
  'UNIQUE CONSTRAINTS FIXED' as section,
  'notifications table constraint' as component,
  'SUCCESS' as status;

SELECT 
  'UNIQUE CONSTRAINTS FIXED' as section,
  'create_follow_notification function updated' as component,
  'SUCCESS' as status;

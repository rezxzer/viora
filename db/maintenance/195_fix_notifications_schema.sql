-- Fix Notifications Table Schema
-- This script checks and fixes the notifications table structure

-- 1. Check current notifications table structure
SELECT 
  'NOTIFICATIONS CURRENT STRUCTURE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 2. Check what columns the application is trying to use
SELECT 
  'APPLICATION USAGE CHECK' as section,
  'The app might be looking for these columns:' as info,
  'actor_id, target_id, action_type' as expected_columns;

-- 3. Add missing columns if they don't exist
DO $$
BEGIN
  -- Add actor_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN actor_id UUID;
    RAISE NOTICE 'Added actor_id column to notifications table';
  ELSE
    RAISE NOTICE 'actor_id column already exists';
  END IF;
  
  -- Add target_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN target_id UUID;
    RAISE NOTICE 'Added target_id column to notifications table';
  ELSE
    RAISE NOTICE 'target_id column already exists';
  END IF;
  
  -- Add action_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN action_type TEXT;
    RAISE NOTICE 'Added action_type column to notifications table';
  ELSE
    RAISE NOTICE 'action_type column already exists';
  END IF;
END $$;

-- 4. Update the create_follow_notification function to use correct columns
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Check final notifications table structure
SELECT 
  'NOTIFICATIONS FINAL STRUCTURE' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 6. Test notification creation
DO $$
DECLARE
  test_user_id uuid;
  test_notification_id bigint;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test notification with all columns
    INSERT INTO public.notifications (
      user_id, type, title, message, related_id, 
      actor_id, target_id, action_type, created_at
    ) VALUES (
      test_user_id, 'test', 'Test Notification', 'This is a test', test_user_id,
      test_user_id, test_user_id, 'test', NOW()
    ) RETURNING id INTO test_notification_id;
    
    RAISE NOTICE 'Test notification created with ID: %', test_notification_id;
    
    -- Clean up test notification
    DELETE FROM public.notifications WHERE id = test_notification_id;
    RAISE NOTICE 'Test notification cleaned up';
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- 7. Final status
SELECT 
  'NOTIFICATIONS SCHEMA FIXED' as section,
  'All required columns added' as info,
  'SUCCESS' as status;

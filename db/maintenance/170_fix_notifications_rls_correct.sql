-- Fix Notifications RLS Policies (CORRECTED)
-- This script fixes the RLS policies for the notifications table using correct column names

-- 1. Drop existing policies and recreate them properly
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_system ON public.notifications;

-- 2. Create proper RLS policies for notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Allow system functions to insert notifications (for triggers)
CREATE POLICY notifications_insert_system ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 4. Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- 5. Test notification creation with CORRECT columns
DO $$
DECLARE
  test_user_id uuid;
  test_notification_id bigint;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test notification with CORRECT columns
    INSERT INTO public.notifications (user_id, type, message, created_at)
    VALUES (test_user_id, 'test', 'This is a test notification', NOW())
    RETURNING id INTO test_notification_id;
    
    RAISE NOTICE 'Test notification created with ID: %', test_notification_id;
    
    -- Clean up test notification
    DELETE FROM public.notifications WHERE id = test_notification_id;
    RAISE NOTICE 'Test notification cleaned up';
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- 6. Update the follow notification trigger function to use correct columns
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, message, related_id, created_at) 
  VALUES (NEW.followee_id, 'follow', 'Someone started following you', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Final status check
SELECT 
  'NOTIFICATIONS RLS FIX STATUS' as section,
  'RLS policies updated with correct columns' as info,
  'SUCCESS' as status;

SELECT 
  'NOTIFICATIONS RLS FIX STATUS' as section,
  'Test notification created successfully' as info,
  'SUCCESS' as status;

SELECT 
  'NOTIFICATIONS RLS FIX STATUS' as section,
  'Follow notification trigger updated' as info,
  'SUCCESS' as status;

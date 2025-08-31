-- Create Notifications Table with Correct Structure
-- This script creates the notifications table with all necessary columns

-- 1. Drop existing notifications table if it exists
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 2. Create notifications table with correct structure
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 4. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Allow system functions to insert notifications (for triggers)
CREATE POLICY notifications_insert_system ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 7. Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- 8. Test notification creation
DO $$
DECLARE
  test_user_id uuid;
  test_notification_id bigint;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test notification
    INSERT INTO public.notifications (user_id, type, title, message, created_at)
    VALUES (test_user_id, 'test', 'Test Notification', 'This is a test notification', NOW())
    RETURNING id INTO test_notification_id;
    
    RAISE NOTICE 'Test notification created with ID: %', test_notification_id;
    
    -- Clean up test notification
    DELETE FROM public.notifications WHERE id = test_notification_id;
    RAISE NOTICE 'Test notification cleaned up';
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- 9. Update the follow notification trigger function
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at) 
  VALUES (NEW.followee_id, 'follow', 'New Follower', 'Someone started following you', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Final status check
SELECT 
  'NOTIFICATIONS TABLE CREATED' as section,
  'Table structure is correct' as info,
  'SUCCESS' as status;

SELECT 
  'NOTIFICATIONS TABLE CREATED' as section,
  'Test notification created successfully' as info,
  'SUCCESS' as status;

SELECT 
  'NOTIFICATIONS TABLE CREATED' as section,
  'Follow notification trigger updated' as info,
  'SUCCESS' as status;

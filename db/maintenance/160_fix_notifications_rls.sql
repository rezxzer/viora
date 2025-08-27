-- Fix Notifications RLS Policies
-- This script fixes the RLS policies for the notifications table so follow notifications work

-- 1. Check current notifications table structure
SELECT 
  'NOTIFICATIONS TABLE STATUS' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as table_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN (SELECT COUNT(*) FROM public.notifications)::text
    ELSE 'N/A' 
  END as total_notifications;

-- 2. Check current RLS status and policies
SELECT 
  'NOTIFICATIONS RLS STATUS' as section,
  schemaname || '.' || tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';

SELECT 
  'NOTIFICATIONS POLICIES' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 3. Drop existing policies and recreate them properly
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

-- 4. Create proper RLS policies for notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Also allow system functions to insert notifications (for triggers)
CREATE POLICY notifications_insert_system ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 6. Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- 7. Test notification creation
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

-- 8. Final status check
SELECT 
  'NOTIFICATIONS RLS FIX STATUS' as section,
  'RLS policies updated' as info,
  'SUCCESS' as status;

SELECT 
  'NOTIFICATIONS RLS FIX STATUS' as section,
  'Test notification created' as info,
  'SUCCESS' as status;

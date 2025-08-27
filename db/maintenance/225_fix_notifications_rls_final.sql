-- Fix Notifications RLS Policies (FINAL)

-- 1. Check current RLS status on notifications table
SELECT 
  'NOTIFICATIONS RLS STATUS' as section,
  schemaname || '.' || tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';

-- 2. Check current RLS policies on notifications table
SELECT 
  'NOTIFICATIONS RLS POLICIES' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 3. Drop ALL existing RLS policies on notifications table
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_system ON public.notifications;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

-- 4. Create comprehensive RLS policies for notifications table

-- Policy 1: Users can SELECT their own notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own notifications
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own notifications
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy 4: Users can DELETE their own notifications
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy 5: SYSTEM/TRIGGER functions can INSERT notifications (CRITICAL!)
CREATE POLICY notifications_insert_system ON public.notifications
  FOR INSERT 
  WITH CHECK (true);

-- Policy 6: SYSTEM/TRIGGER functions can SELECT notifications
CREATE POLICY notifications_select_system ON public.notifications
  FOR SELECT 
  USING (true);

-- 5. Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- 6. Test notification creation by trigger function
DO $$
DECLARE
  test_user_id uuid;
  test_notification_id bigint;
BEGIN
  -- Get a test user ID
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a test notification (simulating trigger function)
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
      test_user_id, 
      'test', 
      'Test Notification', 
      'This is a test notification from trigger', 
      test_user_id,
      test_user_id,
      test_user_id,
      'test',
      NOW()
    ) RETURNING id INTO test_notification_id;
    
    RAISE NOTICE 'SUCCESS: Test notification created with ID: %', test_notification_id;
    
    -- Clean up test notification
    DELETE FROM public.notifications WHERE id = test_notification_id;
    RAISE NOTICE 'Test notification cleaned up';
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- 7. Test follow notification creation (simulating the actual trigger)
DO $$
DECLARE
  test_user1_id uuid;
  test_user2_id uuid;
BEGIN
  -- Get two test user IDs
  SELECT id INTO test_user1_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users OFFSET 1 LIMIT 1;
  
  IF test_user1_id IS NOT NULL AND test_user2_id IS NOT NULL AND test_user1_id != test_user2_id THEN
    -- Simulate the create_follow_notification function
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
      test_user2_id,  -- followee_id (who receives notification)
      'follow', 
      'New Follower', 
      'Someone started following you', 
      test_user1_id,  -- follower_id (who performed action)
      test_user1_id,  -- actor_id
      test_user2_id,  -- target_id
      'follow',
      NOW()
    );
    
    RAISE NOTICE 'SUCCESS: Follow notification created successfully';
    
    -- Clean up test notification
    DELETE FROM public.notifications WHERE related_id = test_user1_id AND type = 'follow';
    RAISE NOTICE 'Test follow notification cleaned up';
  ELSE
    RAISE NOTICE 'Not enough users for testing follow notification';
  END IF;
END $$;

-- 8. Final RLS policy verification
SELECT 
  'FINAL RLS STATUS' as section,
  'notifications table RLS enabled' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND rowsecurity = true) 
    THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as status;

SELECT 
  'FINAL RLS STATUS' as section,
  'notifications RLS policies count' as component,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications')::text as status;

SELECT 
  'FINAL RLS STATUS' as section,
  'notifications insert_system policy' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_insert_system') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

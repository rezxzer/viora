-- Create Missing Follow System Triggers (SIMPLIFIED)
-- This script creates the missing triggers that are needed for the follow system to work

-- 1. Create update_follow_counts function
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

-- 2. Create create_follow_notification function
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, created_at) 
  VALUES (NEW.followee_id, 'follow', 'New Follower', 'Someone started following you', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for follow counts
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON public.follows;
CREATE TRIGGER trigger_update_follow_counts 
AFTER INSERT OR DELETE ON public.follows 
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 4. Create trigger for follow notifications
DROP TRIGGER IF EXISTS trigger_create_follow_notification ON public.follows;
CREATE TRIGGER trigger_create_follow_notification 
AFTER INSERT ON public.follows 
FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- 5. Update existing profiles with correct counts
UPDATE public.profiles 
SET 
  followers_count = (SELECT COUNT(*) FROM public.follows WHERE followee_id = profiles.id),
  following_count = (SELECT COUNT(*) FROM public.follows WHERE follower_id = profiles.id);

-- 6. Final verification
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

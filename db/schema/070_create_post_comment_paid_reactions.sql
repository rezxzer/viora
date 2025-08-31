-- Create post_comment_paid_reactions table for VIORA reactions (idempotent)

-- Check if post_comment_paid_reactions table exists and create if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'post_comment_paid_reactions'
  ) THEN
    CREATE TABLE public.post_comment_paid_reactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      reaction_code text NOT NULL,
      amount_cents integer NOT NULL DEFAULT 100,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(comment_id, user_id, reaction_code)
    );
    
    -- Enable RLS
    ALTER TABLE public.post_comment_paid_reactions ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Created post_comment_paid_reactions table';
  ELSE
    RAISE NOTICE 'post_comment_paid_reactions table already exists';
  END IF;
END
$$;

-- Add indexes for better performance (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND indexname = 'idx_post_comment_paid_reactions_comment'
  ) THEN
    CREATE INDEX idx_post_comment_paid_reactions_comment ON public.post_comment_paid_reactions(comment_id);
    RAISE NOTICE 'Created comment index';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND indexname = 'idx_post_comment_paid_reactions_user'
  ) THEN
    CREATE INDEX idx_post_comment_paid_reactions_user ON public.post_comment_paid_reactions(user_id);
    RAISE NOTICE 'Created user index';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND indexname = 'idx_post_comment_paid_reactions_code'
  ) THEN
    CREATE INDEX idx_post_comment_paid_reactions_code ON public.post_comment_paid_reactions(reaction_code);
    RAISE NOTICE 'Created code index';
  END IF;
END
$$;

-- Create policies (idempotent)
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND policyname = 'post_comment_paid_reactions_select_all'
  ) THEN
    DROP POLICY post_comment_paid_reactions_select_all ON public.post_comment_paid_reactions;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND policyname = 'post_comment_paid_reactions_insert_own'
  ) THEN
    DROP POLICY post_comment_paid_reactions_insert_own ON public.post_comment_paid_reactions;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'post_comment_paid_reactions' 
    AND policyname = 'post_comment_paid_reactions_delete_own'
  ) THEN
    DROP POLICY post_comment_paid_reactions_delete_own ON public.post_comment_paid_reactions;
  END IF;
  
  -- Create new policies
  CREATE POLICY post_comment_paid_reactions_select_all ON public.post_comment_paid_reactions
    FOR SELECT USING (true);
    
  CREATE POLICY post_comment_paid_reactions_insert_own ON public.post_comment_paid_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY post_comment_paid_reactions_delete_own ON public.post_comment_paid_reactions
    FOR DELETE USING (auth.uid() = user_id);
    
  RAISE NOTICE 'Updated post_comment_paid_reactions policies';
END
$$;

-- Grant permissions (idempotent)
GRANT SELECT, INSERT, DELETE ON public.post_comment_paid_reactions TO anon, authenticated;

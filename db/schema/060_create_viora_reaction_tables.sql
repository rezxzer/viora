-- Create tables for VIORA comment reactions (idempotent)

-- Check if reaction_types table exists and create if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reaction_types'
  ) THEN
    CREATE TABLE public.reaction_types (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      name text NOT NULL,
      emoji text NOT NULL,
      default_price_cents integer NOT NULL DEFAULT 100,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.reaction_types ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Created reaction_types table';
  ELSE
    RAISE NOTICE 'reaction_types table already exists';
  END IF;
END
$$;

-- Insert VIORA reaction type if it doesn't exist
INSERT INTO public.reaction_types (code, name, emoji, default_price_cents)
VALUES ('VIORA', 'VIORA', '💎', 100)
ON CONFLICT (code) DO NOTHING;

-- Create policies for reaction_types (idempotent)
DO $$
BEGIN
  -- Drop existing policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'reaction_types' 
    AND policyname = 'reaction_types_select_all'
  ) THEN
    DROP POLICY reaction_types_select_all ON public.reaction_types;
  END IF;
  
  -- Create new policy
  CREATE POLICY reaction_types_select_all ON public.reaction_types
    FOR SELECT USING (true);
    
  RAISE NOTICE 'Updated reaction_types policies';
END
$$;

-- Grant permissions (idempotent)
GRANT SELECT ON public.reaction_types TO anon, authenticated;

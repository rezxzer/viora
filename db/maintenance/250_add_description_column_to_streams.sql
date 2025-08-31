-- Add description column to streams table
-- This migration adds the missing description column that the app code expects
-- SUCCESSFULLY EXECUTED IN SUPABASE

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='description'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN description text;
    RAISE NOTICE 'Added description column to streams table';
  ELSE
    RAISE NOTICE 'Description column already exists in streams table';
  END IF;
END$$;

-- Add is_live column to streams table
-- This migration adds the missing is_live column that the app code expects
-- SUCCESSFULLY EXECUTED IN SUPABASE

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='is_live'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN is_live boolean DEFAULT false;
    
    -- Update existing streams to set is_live based on status
    UPDATE public.streams SET is_live = (status = 'active');
    
    RAISE NOTICE 'Added is_live column to streams table and updated existing data';
  ELSE
    RAISE NOTICE 'is_live column already exists in streams table';
  END IF;
END$$;

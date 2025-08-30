-- Add mux_stream_key column to streams table
-- This migration adds the missing mux_stream_key column that the app code expects
-- SUCCESSFULLY EXECUTED IN SUPABASE

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='streams' AND column_name='mux_stream_key'
  ) THEN
    ALTER TABLE public.streams ADD COLUMN mux_stream_key text;
    RAISE NOTICE 'Added mux_stream_key column to streams table';
  ELSE
    RAISE NOTICE 'mux_stream_key column already exists in streams table';
  END IF;
END$$;

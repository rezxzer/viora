-- Add parent_id to comments for threaded replies (idempotent)

-- Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'comments'
      AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.comments
      ADD COLUMN parent_id uuid NULL REFERENCES public.comments(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Helpful index for parent lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);



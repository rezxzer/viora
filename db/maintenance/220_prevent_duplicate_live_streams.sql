-- Prevent duplicate live streams per creator
-- One LIVE stream per creator

-- Create unique partial index to prevent multiple live streams from same creator
CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_stream_per_creator
ON public.streams (creator_id)
WHERE status = 'live';

-- Create index for latest stream sessions (useful for queries)
CREATE INDEX IF NOT EXISTS idx_stream_sessions_latest
ON public.stream_sessions (stream_id, created_at DESC);

-- Add comment explaining the constraint
COMMENT ON INDEX uniq_live_stream_per_creator IS 'Prevents multiple live streams from the same creator simultaneously';
COMMENT ON INDEX idx_stream_sessions_latest IS 'Optimizes queries for latest stream sessions';

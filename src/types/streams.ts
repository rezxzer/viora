export type StreamStatus =
  | 'idle'
  | 'active'
  | 'ended'
  | 'errored'
  | 'disabled'
  | 'recording'
  | 'processing'

export interface Stream {
  id: string
  title: string
  description?: string | null
  creator_id: string
  status: StreamStatus
  is_live?: boolean
  visibility?: string
  playback_id?: string | null
  playback_url?: string | null
  mux_live_stream_id?: string | null
  mux_stream_key?: string | null
  mux_asset_id?: string | null
  thumbnail_url?: string | null
  created_at: string
  started_at?: string | null
  ended_at?: string | null
  last_status_at?: string | null
  last_error?: string | null
  viewers_count?: number
}

export interface StreamSession {
  id: string
  stream_id: string
  provider?: string
  ingest_url?: string
  rtmp_key?: string
  hls_url?: string
  recording_url?: string
  status: StreamStatus
  started_at?: string | null
  ended_at?: string | null
  created_at?: string
}

export interface CreateStreamResponse {
  stream: Stream
  session: StreamSession
  reused?: boolean
  message?: string
}

export interface UpdateStatusResponse {
  stream: Stream
}

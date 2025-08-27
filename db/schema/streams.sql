-- Streams master table
create table if not exists public.streams (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Stream',
  status text not null default 'idle', -- 'idle' | 'live' | 'ended'
  visibility text not null default 'public', -- 'public' | 'subscribers' | 'private'
  playback_url text,
  thumbnail_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Stream sessions (per live run)
create table if not exists public.stream_sessions (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  provider text not null default 'mux', -- 'mux' | 'cloudflare'
  ingest_url text,
  rtmp_key text,
  hls_url text,
  recording_url text,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Helpful index
create index if not exists idx_stream_sessions_stream_id_created_at
  on public.stream_sessions(stream_id, created_at desc);

-- Enable RLS
alter table public.streams enable row level security;
alter table public.stream_sessions enable row level security;

-- Policies: streams
do $$
begin
  -- public read only for public streams
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='streams' and policyname='streams_select_public'
  ) then
    create policy streams_select_public on public.streams
      for select
      using (
        visibility = 'public'
        or auth.uid() = creator_id
        or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
      );
  end if;

  -- insert/update/delete by owner or service
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='streams' and policyname='streams_cud_owner'
  ) then
    create policy streams_cud_owner on public.streams
      for all
      using (auth.uid() = creator_id
             or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
      with check (auth.uid() = creator_id
                  or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
  end if;
end $$;

-- Policies: stream_sessions
do $$
begin
  -- read: owner or public via parent visibility='public'
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='stream_sessions' and policyname='sessions_select'
  ) then
    create policy sessions_select on public.stream_sessions
      for select
      using (
        exists (
          select 1 from public.streams s
          where s.id = stream_sessions.stream_id
            and (
              s.visibility = 'public'
              or s.creator_id = auth.uid()
              or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
            )
        )
      );
  end if;

  -- cud: owner / service
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='stream_sessions' and policyname='sessions_cud_owner'
  ) then
    create policy sessions_cud_owner on public.stream_sessions
      for all
      using (
        exists (
          select 1 from public.streams s
          where s.id = stream_sessions.stream_id
            and (s.creator_id = auth.uid()
                 or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
        )
      )
      with check (
        exists (
          select 1 from public.streams s
          where s.id = stream_sessions.stream_id
            and (s.creator_id = auth.uid()
                 or current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
        )
      );
  end if;
end $$;

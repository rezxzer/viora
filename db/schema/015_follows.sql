-- Follows table + RLS

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

create index if not exists idx_follows_followee on public.follows(followee_id);
create index if not exists idx_follows_follower on public.follows(follower_id);

alter table public.follows enable row level security;

drop policy if exists follows_select_public on public.follows;
create policy follows_select_public on public.follows
  for select using (true);

drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows
  for delete using (auth.uid() = follower_id);

-- Follows table and RLS (idempotent)

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_followee ON public.follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follows_select_public ON public.follows;
CREATE POLICY follows_select_public ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS follows_insert_self ON public.follows;
CREATE POLICY follows_insert_self ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS follows_delete_self ON public.follows;
CREATE POLICY follows_delete_self ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);



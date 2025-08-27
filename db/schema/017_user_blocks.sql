-- User blocks (prevent interactions) + RLS

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  primary key (blocker_id, blocked_id)
);

create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_id);
create index if not exists idx_user_blocks_blocker on public.user_blocks(blocker_id);

alter table public.user_blocks enable row level security;

-- blocker can see/manage own blocks; admin can see all
drop policy if exists user_blocks_select_own_admin on public.user_blocks;
create policy user_blocks_select_own_admin on public.user_blocks
  for select using (auth.uid() = blocker_id or public.is_admin());

drop policy if exists user_blocks_insert_self on public.user_blocks;
create policy user_blocks_insert_self on public.user_blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists user_blocks_delete_self on public.user_blocks;
create policy user_blocks_delete_self on public.user_blocks
  for delete using (auth.uid() = blocker_id or public.is_admin());

-- user_blocks table and RLS (idempotent)

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Only blocker can see/manage their block list
DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS user_blocks_insert_own ON public.user_blocks;
CREATE POLICY user_blocks_insert_own ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS user_blocks_delete_own ON public.user_blocks;
CREATE POLICY user_blocks_delete_own ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);



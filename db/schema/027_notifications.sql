-- Base notifications table + RLS

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like','comment','follow','system')),
  actor_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid null,
  comment_id uuid null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_select_own'
  ) then
    create policy notifications_select_own on public.notifications
      for select using (auth.uid() = user_id or public.is_admin());
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_insert_anyone'
  ) then
    create policy notifications_insert_anyone on public.notifications
      for insert with check (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_update_own'
  ) then
    create policy notifications_update_own on public.notifications
      for update using (auth.uid() = user_id or public.is_admin())
      with check (auth.uid() = user_id or public.is_admin());
  end if;
end$$;

-- Notifications table (idempotent)
-- Stores like/comment/follow notifications

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like','comment','follow')),
  actor_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid null references public.posts(id) on delete cascade,
  comment_id uuid null references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

-- Dedupe for follow notifications (used by ON CONFLICT ON CONSTRAINT)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uniq_notifications_follow'
  ) then
    alter table public.notifications
      add constraint uniq_notifications_follow unique (user_id, type, actor_id);
  end if;
end$$;

-- Helpful indexes
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at);

-- RLS
alter table public.notifications enable row level security;

-- Allow the owner to read and update their notifications
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_select_own'
  ) then
    create policy notifications_select_own on public.notifications for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_update_own'
  ) then
    create policy notifications_update_own on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- Allow inserts from app/trigger; open for now (can tighten later)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_insert_anyone'
  ) then
    create policy notifications_insert_anyone on public.notifications for insert with check (true);
  end if;
end$$;



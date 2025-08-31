-- viora: post views tracking (30s dedup per viewer/post)
-- Idempotent migration

-- 1) Table
create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  viewer_id uuid null default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2) Indexes for querying
create index if not exists post_views_post_id_created_at_idx
  on public.post_views (post_id, created_at desc);
create index if not exists post_views_viewer_id_created_at_idx
  on public.post_views (viewer_id, created_at desc);

-- 3) RLS: allow inserts from anon/auth
alter table public.post_views enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'post_views' and policyname = 'allow_insert_anyone'
  ) then
    create policy allow_insert_anyone
      on public.post_views for insert
      to anon, authenticated
      with check (true);
  end if;
end$$;

-- 4) 30s dedupe per (post_id, viewer_id) using exclusion constraint (no overlapping 30s window)
create extension if not exists btree_gist;

-- drop legacy unique index if it exists from previous attempts
do $$
begin
  if exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='post_views' and indexname='post_views_dedupe_30s') then
    execute 'drop index if exists public.post_views_dedupe_30s';
  end if;
end$$;

alter table public.post_views
  add constraint if not exists post_views_dedupe_30s_excl
  exclude using gist (
    post_id with =,
    coalesce(viewer_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    tstzrange(created_at, created_at + interval '30 seconds') with &&
  );



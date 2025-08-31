-- Analytics: generic events + post_views (dedup)

-- Generic events table
create table if not exists public.events (
  id bigserial primary key,
  event_type text not null,
  actor_id uuid null references auth.users(id) on delete set null,
  target_id uuid null,
  props jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_type_time on public.events(event_type, created_at desc);
create index if not exists idx_events_actor on public.events(actor_id);

alter table public.events enable row level security;
drop policy if exists events_insert_anyone on public.events;
create policy events_insert_anyone on public.events for insert with check (true);
drop policy if exists events_select_admin on public.events;
create policy events_select_admin on public.events for select using (public.is_admin());

-- Post views dedup within 30s buckets
create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  viewer_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  bucket_30s bigint not null default (extract(epoch from now())::bigint / 30)
);

create unique index if not exists post_views_dedupe_30s
  on public.post_views (post_id, coalesce(viewer_id, '00000000-0000-0000-0000-000000000000'::uuid), bucket_30s);

create index if not exists post_views_post_time on public.post_views(post_id, created_at desc);

alter table public.post_views enable row level security;
drop policy if exists post_views_insert_anyone on public.post_views;
create policy post_views_insert_anyone on public.post_views for insert with check (true);
drop policy if exists post_views_select_admin on public.post_views;
create policy post_views_select_admin on public.post_views for select using (public.is_admin());



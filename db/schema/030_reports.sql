-- Reports (content moderation) + RLS

create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid null references public.posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','nsfw','abuse','other')),
  note text null,
  status text not null default 'open' check (status in ('open','reviewed','resolved')),
  resolved_by uuid null references auth.users(id) on delete set null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_post on public.reports(post_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_reporter on public.reports(reporter_id);

alter table public.reports enable row level security;

-- reporter can insert; actor must match reporter_id
drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports
  for insert with check (auth.uid() = reporter_id);

-- reporter can see own reports; admins see all
drop policy if exists reports_select_own_admin on public.reports;
create policy reports_select_own_admin on public.reports
  for select using (auth.uid() = reporter_id or public.is_admin());

-- only admins can update/delete (moderation actions)
drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists reports_delete_admin on public.reports;
create policy reports_delete_admin on public.reports
  for delete using (public.is_admin());



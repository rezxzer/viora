-- Maintenance: ensure safe RLS policies for notifications

-- Drop blocking insert policy if it exists
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_insert_block'
  ) then
    drop policy notifications_insert_block on public.notifications;
  end if;
end$$;

-- Allow INSERT for anon/auth
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_insert_anyone'
  ) then
    create policy notifications_insert_anyone on public.notifications for insert to anon, authenticated with check (true);
  end if;
end$$;

-- Allow SELECT for owner
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notifications' and policyname='notifications_select_own'
  ) then
    create policy notifications_select_own on public.notifications for select to anon, authenticated using (auth.uid() = user_id);
  end if;
end$$;

alter table public.notifications enable row level security;



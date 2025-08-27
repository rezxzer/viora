-- Feature flags and app settings

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.tg_app_settings_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='tg_app_settings_touch') then
    create trigger tg_app_settings_touch
      before update on public.app_settings
      for each row execute function public.tg_app_settings_touch();
  end if;
end$$;

alter table public.app_settings enable row level security;

-- read open; write admin only
drop policy if exists app_settings_select_public on public.app_settings;
create policy app_settings_select_public on public.app_settings for select using (true);

drop policy if exists app_settings_write_admin on public.app_settings;
create policy app_settings_write_admin on public.app_settings
  for insert with check (public.is_admin());

create policy app_settings_update_admin on public.app_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- feature flags
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text null,
  updated_at timestamptz not null default now()
);

create or replace function public.tg_feature_flags_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='tg_feature_flags_touch') then
    create trigger tg_feature_flags_touch
      before update on public.feature_flags
      for each row execute function public.tg_feature_flags_touch();
  end if;
end$$;

alter table public.feature_flags enable row level security;

drop policy if exists feature_flags_select_public on public.feature_flags;
create policy feature_flags_select_public on public.feature_flags for select using (true);

drop policy if exists feature_flags_write_admin on public.feature_flags;
create policy feature_flags_write_admin on public.feature_flags
  for insert with check (public.is_admin());

create policy feature_flags_update_admin on public.feature_flags
  for update using (public.is_admin()) with check (public.is_admin());



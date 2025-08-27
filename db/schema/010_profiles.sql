-- Profiles base table + enum + RLS

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='privacy_level'
  ) then
    create type public.privacy_level as enum ('public','followers_only','verified_only');
  end if;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  website text,
  birthday date,
  links jsonb,
  pronouns text,
  privacy_level public.privacy_level default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.tg_profiles_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='tg_profiles_touch') then
    create trigger tg_profiles_touch
      before update on public.profiles
      for each row execute function public.tg_profiles_touch_updated_at();
  end if;
end$$;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_select_public'
  ) then
    create policy profiles_select_public on public.profiles for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_upsert_self'
  ) then
    create policy profiles_upsert_self on public.profiles for insert with check (auth.uid() = id);
    create policy profiles_update_self on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end$$;

-- Profiles schema additions: privacy_level enum + column (idempotent)

-- Ensure privacy_level enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'privacy_level'
  ) THEN
    CREATE TYPE public.privacy_level AS ENUM ('public', 'followers_only', 'verified_only');
  END IF;
END
$$;

-- Add column to profiles if missing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_level public.privacy_level DEFAULT 'public';

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_level
  ON public.profiles(privacy_level);



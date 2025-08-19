-- =========================================
-- ეს კოდი ჩასასმელია Supabase-ში
-- ეს ცვლის არსებულ ობიექტებს: (თუ უკვე არსებობდა იგივე სახელის policy/trigger, ის შეიცვლება)
-- =========================================

-- 1) updated_at helper (idempotent)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) profiles table (idempotent)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) updated_at trigger (replace if exists)
drop trigger if exists tr_profiles_updated_at on public.profiles;
create trigger tr_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 4) Enable RLS
alter table public.profiles enable row level security;

-- 5) Policies (replace if exist)
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles
  for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);



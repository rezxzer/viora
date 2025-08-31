-- Admin detection helper

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false),
    false
  );
$$;



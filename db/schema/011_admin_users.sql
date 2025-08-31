-- File: db/schema/011_admin_users.sql
-- Admin users utilities: list users and toggle admin

-- Returns a list of users for the admin panel without exposing auth.users directly.
-- Uses security definer and explicit admin check.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin only';
  end if;

  return query
  select u.id,
         u.email,
         u.created_at,
         coalesce((u.raw_user_meta_data ->> 'is_admin')::boolean, false) as is_admin
  from auth.users u
  order by u.created_at desc
  limit 200; -- safety cap
end;
$$;

-- Reuse set_user_admin() from maintenance to toggle admin flags.
-- If not present, create a thin wrapper to call it safely.
create or replace function public.admin_toggle_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.set_user_admin(p_user_id, p_is_admin);
end;
$$;



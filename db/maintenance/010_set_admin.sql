-- File: db/maintenance/010_set_admin.sql
-- Helpers to promote/demote admin via auth.users user_metadata

-- Requires that public.is_admin() already exists (see db/schema/005_is_admin.sql)

create or replace function public.set_user_admin(
  p_user_id uuid,
  p_is_admin boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only an existing admin can call this function
  if not public.is_admin() then
    raise exception 'forbidden: admin only';
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                             || jsonb_build_object('is_admin', p_is_admin)
  where id = p_user_id;
end;
$$;

create or replace function public.set_user_admin_by_email(
  p_email text,
  p_is_admin boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Only an existing admin can call this function
  if not public.is_admin() then
    raise exception 'forbidden: admin only';
  end if;

  select id into v_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_id is null then
    raise exception 'user not found for email %', p_email;
  end if;
  perform public.set_user_admin(v_id, p_is_admin);
end;
$$;

-- Usage (examples):
-- select public.set_user_admin('<USER_UUID>', true);
-- select public.set_user_admin_by_email('admin@example.com', true);
-- select public.set_user_admin_by_email('admin@example.com', false);



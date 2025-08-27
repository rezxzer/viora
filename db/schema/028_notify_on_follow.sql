-- Follow notification trigger (idempotent)

create unique index if not exists notifications_user_type_actor_uidx
  on public.notifications(user_id, type, actor_id);

create or replace function public.notify_on_follow() returns trigger
language plpgsql as $$
begin
  if new.follower_id = new.followee_id then
    return null;
  end if;

  insert into public.notifications (user_id, type, actor_id)
  values (new.followee_id, 'follow', new.follower_id)
  on conflict (user_id, type, actor_id) do nothing;

  return null;
end
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_notify_follow') then
    create trigger trg_notify_follow
      after insert on public.follows
      for each row execute function public.notify_on_follow();
  end if;
end$$;

-- Notifications: follow trigger (idempotent)
-- Ensures a notification row is created when someone follows a user

-- 1) Unique index used by ON CONFLICT (safe if already exists)
create unique index if not exists notifications_user_type_actor_uidx
  on public.notifications(user_id, type, actor_id);

-- 2) Trigger function: on follow insert → insert notification
create or replace function public.notify_on_follow() returns trigger
language plpgsql as $$
begin
  -- Skip self-follow just in case
  if new.follower_id = new.followee_id then
    return null;
  end if;

  insert into public.notifications (user_id, type, actor_id)
  values (new.followee_id, 'follow', new.follower_id)
  on conflict (user_id, type, actor_id) do nothing;

  return null;
end
$$;

-- 3) Create trigger (only if missing)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_notify_follow'
  ) then
    create trigger trg_notify_follow
      after insert on public.follows
      for each row execute function public.notify_on_follow();
  end if;
end$$;


